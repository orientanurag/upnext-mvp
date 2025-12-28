require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateToken, authenticateToken } = require('./utils/auth');
const musicService = require('./services/musicService');
const slotService = require('./services/slotService');// Initialize Prisma client with connection handling
const prisma = new PrismaClient({ log: ['error', 'warn'] });
let dbConnected = false;
prisma.$connect()
    .then(() => {
        console.log('💾 Database connected successfully');
        dbConnected = true;
    })
    .catch((error) => {
        console.error('❌ Database connection failed:', error.message);
        console.error('Server will start but database features will be unavailable');
        dbConnected = false;
    });

// Global handler for unhandled promise rejections to prevent server crash
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const MIN_BID_AMOUNT = parseInt(process.env.MIN_BID_AMOUNT) || 50;

// --- HTTP API Endpoints ---

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        database: prisma ? 'connected' : 'disconnected'
    });
});

// Music search
app.get('/api/music/search', async (req, res) => {
    try {
        const { q, limit = 25 } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter required' });
        }
        const results = await musicService.searchSongs(q, parseInt(limit));
        res.json(results);
    } catch (error) {
        console.error('Music search error (handled):', error.message);
        // Return empty result set to keep UI functional
        res.status(200).json({ data: [], total: 0, message: 'Music service unavailable' });
    }
});

// Get genres
app.get('/api/music/genres', async (req, res) => {
    try {
        const genres = await musicService.getGenres();
        res.json(genres);
    } catch (error) {
        console.error('Genres error:', error);
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

// Get albums by genre
app.get('/api/music/genre/:id/albums', async (req, res) => {
    try {
        const albums = await musicService.getAlbumsByGenre(req.params.id);
        res.json(albums);
    } catch (error) {
        console.error('Albums error:', error);
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
});

// Get tracks by album
app.get('/api/music/album/:id/tracks', async (req, res) => {
    try {
        const tracks = await musicService.getTracksByAlbum(req.params.id);
        res.json(tracks);
    } catch (error) {
        console.error('Tracks error:', error);
        res.status(500).json({ error: 'Failed to fetch tracks' });
    }
});

// --- Wallet Endpoints ---

// Get wallet balance
app.get('/api/wallet/balance', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.json({ balance: 0 });

        const wallet = await prisma.userWallet.findUnique({
            where: { userId }
        });

        res.json({ balance: wallet?.balance || 0 });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Add money to wallet
app.post('/api/wallet/add', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const wallet = await prisma.userWallet.upsert({
            where: { userId },
            create: { userId, balance: amount },
            update: { balance: { increment: amount } }
        });

        await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: parseFloat(amount),
                type: 'CREDIT',
                description: 'Added money to wallet'
            }
        });

        res.json({ balance: wallet.balance });
    } catch (error) {
        console.error('Add money error:', error);
        res.status(500).json({ error: 'Failed to add money' });
    }
});

// --- Slot Endpoints ---

// Get current slot
app.get('/api/slots/current', async (req, res) => {
    try {
        const event = await prisma.event.findFirst({
            where: { isActive: true }
        });

        if (!event) return res.json(null);

        // Logic to detect if we moved to a new slot?
        // We can just get the *calculated* current slot.
        // If the *stored* state implies a transition, trigger cleanup?
        // Simpler: Just rely on getCurrentSlot to clean up invalid slots if we added that?
        // No, let's do it explicitly if needed.
        // For this MVP, we will rely on a "check" mechanism.

        const slot = await slotService.getCurrentSlot(prisma, event.id);

        // Basic Auto-Refund Check (Optimistic)
        // Check if there are ANY 'paid' bids in previous slots (slots with number < current)
        // This effectively cleans up "old" windows.
        if (slot) {
            const oldSlots = await prisma.vibeSlot.findMany({
                where: {
                    eventId: event.id,
                    slotNumber: { lt: slot.slotNumber },
                    status: { not: 'processed' } // Add a processed marker? Or just query bids directly
                }
            });

            // To avoid schema changes for 'status', we query bids directly where slotNumber < current
            // Actually, we can just look for bids where vibeSlot.slotNumber < currentSlot.slotNumber
            const expiredBids = await prisma.bid.findMany({
                where: {
                    event: { id: event.id },
                    vibeSlot: { slotNumber: { lt: slot.slotNumber } },
                    status: { in: ['pending', 'approved'] }
                }
            });

            if (expiredBids.length > 0) {
                // Group by slot to process? or just bulk process?
                // slotService.processSlotExpiry handles by slotId, let's loop uniquely
                const slotIds = [...new Set(expiredBids.map(b => b.vibeSlotId))];
                for (const sid of slotIds) {
                    if (sid) await slotService.processSlotExpiry(prisma, sid);
                }
                // Notify Clients
                if (slotIds.length > 0) io.emit('gameStateChanged', { type: 'refund_processed' });
            }
        }

        res.json(slot);
    } catch (error) {
        console.error('Get current slot error:', error);
        res.status(500).json({ error: 'Failed to fetch current slot' });
    }
});

// Get top bids for a slot (supports limit query param)
app.get('/api/slots/:id/top-bids', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const bids = await slotService.getTopBids(prisma, req.params.id, limit);
        res.json(bids);
    } catch (error) {
        console.error('Get top bids error:', error);
        res.status(500).json({ error: 'Failed to fetch top bids' });
    }
});

// Submit a bid (with wallet deduction)
app.post('/api/bids', async (req, res) => {
    console.log('🔔 Received bid request body:', req.body);
    try {
        // Check if database is available
        if (!prisma || !dbConnected) {
            return res.status(503).json({
                error: 'Database not available. Please check server configuration.',
                hint: 'Make sure DATABASE_URL environment variable is set correctly'
            });
        }

        const { songTitle, songArtist, songAlbum, deezerTrackId, message, bidAmount, userName, userEmail, userId } = req.body;

        // Validation
        if (!songTitle || !bidAmount) {
            return res.status(400).json({ error: 'Song title and bid amount are required' });
        }

        const amount = parseFloat(bidAmount);
        if (amount < MIN_BID_AMOUNT) {
            return res.status(400).json({ error: `Minimum bid amount is ₹${MIN_BID_AMOUNT}` });
        }

        // Wallet Check & Deduction
        let wallet = null;
        if (userId) {
            wallet = await prisma.userWallet.findUnique({ where: { userId } });

            if (!wallet || wallet.balance < amount) {
                return res.status(400).json({ error: 'Insufficient wallet balance. Please add money.' });
            }

            // Deduct from wallet
            wallet = await prisma.userWallet.update({
                where: { userId },
                data: { balance: { decrement: amount } }
            });

            // Log Transaction
            await prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amount,
                    type: 'DEBIT',
                    description: `Bid for ${songTitle}`,
                    referenceId: 'pending_bid' // Will update with bid ID if needed
                }
            });
        } else {
            // For now, allow anonymous bids without wallet checks if no userId is provided?
            // User requirement: "user will upload ... amount shall be deducted".
            // Assuming wallet is mandatory for this flow.
            return res.status(400).json({ error: 'User ID required for wallet transaction' });
        }

        // Get or create active event
        let event = await prisma.event.findFirst({
            where: { isActive: true }
        });

        if (!event) {
            // Create a default event if none exists
            event = await prisma.event.create({
                data: {
                    name: 'Default Event',
                    durationHours: 7,
                    vibesPerHour: 4, // 15 mins per slot
                    vibeDurationMinutes: 15,
                    isActive: true,
                    startTime: new Date()
                }
            });
            // Generate slots for new event
            await slotService.generateSlots(prisma, event);
        }

        // Get Current Slot
        const currentSlot = await slotService.getCurrentSlot(prisma, event.id);
        const vibeSlotId = currentSlot ? currentSlot.id : null;

        // Safely process optional string fields
        const safeTrim = (value) => (value && typeof value === 'string' ? value.trim() : null);
        const safeString = (value) => value ? String(value) : null;

        // Create bid
        const bid = await prisma.bid.create({
            data: {
                eventId: event.id,
                vibeSlotId: vibeSlotId, // Assign to current slot
                walletId: wallet.id,
                songTitle: songTitle.trim(),
                songArtist: safeTrim(songArtist),
                songAlbum: safeTrim(songAlbum),
                deezerTrackId: safeString(deezerTrackId),
                message: safeTrim(message),
                bidAmount: amount,
                userName: safeTrim(userName) || 'Anonymous',
                userEmail: safeTrim(userEmail),
                status: 'pending',
                paymentStatus: 'paid' // Funds already deducted
            }
        });

        console.log(`📩 New bid: "${bid.songTitle}" for ₹${bid.bidAmount} by ${bid.userName}`);
        if (bid.message) {
            console.log(`   Message: "${bid.message}"`);
        }

        // Broadcast to all clients
        io.emit('bidSubmitted', bid);

        res.status(201).json(bid);
    } catch (error) {
        console.error('Bid submission error:', error);
        console.error(error.stack);
        res.status(500).json({
            error: 'Failed to submit bid',
            details: error.message
        });
    }
});

// Get all bids
app.get('/api/bids', async (req, res) => {
    try {
        // Check if database is available
        if (!prisma || !dbConnected) {
            // Return empty array if DB not available, don't crash
            return res.json([]);
        }

        const { status, limit = 50 } = req.query;

        const where = {};
        if (status) {
            where.status = status;
        }

        const bids = await prisma.bid.findMany({
            where,
            orderBy: [
                { bidAmount: 'desc' },
                { submittedAt: 'desc' }
            ],
            take: parseInt(limit)
        });

        res.json(bids);
    } catch (error) {
        console.error('Get bids error:', error);
        // Return empty array on error instead of crashing
        res.json([]);
    }
});

// Update bid status (DJ action)
app.patch('/api/bids/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved', 'rejected', 'played'

        if (!['approved', 'rejected', 'played'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Fetch existing bid to handle refunds
        const existingBid = await prisma.bid.findUnique({
            where: { id },
            include: { wallet: true }
        });

        if (!existingBid) {
            return res.status(404).json({ error: 'Bid not found' });
        }

        let updatedBid;

        // Handle Refund if Rejecting a Paid Bid
        if (status === 'rejected' && existingBid.paymentStatus === 'paid' && existingBid.walletId) {
            const [walletUpdate, refundTx, bidUpdate] = await prisma.$transaction([
                // Refund wallet
                prisma.userWallet.update({
                    where: { id: existingBid.walletId },
                    data: { balance: { increment: existingBid.bidAmount } }
                }),
                // Log refund transaction
                prisma.walletTransaction.create({
                    data: {
                        walletId: existingBid.walletId,
                        amount: existingBid.bidAmount,
                        type: 'REFUND',
                        description: `Refund for rejected bid: ${existingBid.songTitle}`,
                        referenceId: existingBid.id
                    }
                }),
                // Update bid status
                prisma.bid.update({
                    where: { id },
                    data: { status, paymentStatus: 'refunded' }
                })
            ]);
            updatedBid = bidUpdate;
            console.log(`💸 Refunded ₹${existingBid.bidAmount} for bid "${existingBid.songTitle}"`);
        } else {
            // Standard update for other cases
            const updateData = { status };
            if (status === 'approved') updateData.approvedAt = new Date();
            else if (status === 'played') updateData.playedAt = new Date();

            updatedBid = await prisma.bid.update({
                where: { id },
                data: updateData
            });
        }

        console.log(`✅ Bid ${status}: "${updatedBid.songTitle}"`);

        // Broadcast update
        io.emit('bidUpdated', updatedBid);

        res.json(updatedBid);
    } catch (error) {
        console.error('Update bid error:', error);
        res.status(500).json({ error: 'Failed to update bid' });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const [totalBids, pendingBids, approvedBids, playedBids] = await Promise.all([
            prisma.bid.count(),
            prisma.bid.count({ where: { status: 'pending' } }),
            prisma.bid.count({ where: { status: 'approved' } }),
            prisma.bid.count({ where: { status: 'played' } })
        ]);

        const bids = await prisma.bid.findMany({
            where: {
                status: { in: ['approved', 'played'] }
            }
        });

        const totalRevenue = bids.reduce((sum, bid) => sum + Number(bid.bidAmount), 0);

        res.json({
            totalBids,
            pendingBids,
            approvedBids,
            playedBids,
            totalRevenue
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Admin login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.adminUser.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// All other routes serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// --- Socket.IO for Real-time Updates ---
io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Send initial data
    prisma.bid.findMany({
        orderBy: [
            { bidAmount: 'desc' },
            { submittedAt: 'desc' }
        ],
        take: 50
    }).then(bids => {
        socket.emit('initialData', { bids });
    });

    socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
    });
});

// --- Server Startup ---
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 UPNEXT Server Started');
    console.log('========================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`💰 Min Bid: ₹${MIN_BID_AMOUNT}`);
    console.log(`💾 Database: ${prisma ? 'Connected' : 'Not Connected'}`);
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await prisma.$disconnect();
    server.close(() => {
        console.log('HTTP server closed');
    });
});
