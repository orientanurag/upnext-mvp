require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
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
const SLOT_DURATION_MS = (parseInt(process.env.SLOT_DURATION_MINUTES) || 5) * 60 * 1000;

// --- In-Memory State ---
let gameState = {
  currentSlot: {
    id: Date.now(),
    endTime: Date.now() + SLOT_DURATION_MS,
    status: 'ACTIVE' // ACTIVE, LOCKED
  },
  bids: [], // { id, amount, song, user, timestamp, status: 'pending'|'approved'|'rejected' }
  leaderboard: [], // Top approved bids
  currentWinner: null // The bid currently being played
};

let slotTimer = null;

// --- Helper Functions ---
function startSlotTimer() {
  if (slotTimer) clearTimeout(slotTimer);

  const timeLeft = gameState.currentSlot.endTime - Date.now();
  if (timeLeft > 0) {
    slotTimer = setTimeout(() => {
      console.log('⏰ Slot expired, rotating to next slot');
      nextSlot();
    }, timeLeft);
    console.log(`⏲️  Slot timer set for ${Math.round(timeLeft / 1000)}s`);
  }
}

function nextSlot() {
  gameState.bids = [];
  gameState.leaderboard = [];
  gameState.currentWinner = null;
  gameState.currentSlot = {
    id: Date.now(),
    endTime: Date.now() + SLOT_DURATION_MS,
    status: 'ACTIVE'
  };

  io.emit('stateUpdate', gameState);
  startSlotTimer();
  console.log('🔄 New slot started');
}

// --- HTTP Endpoints ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    currentSlot: gameState.currentSlot,
    totalBids: gameState.bids.length
  });
});

app.get('/api/stats', (req, res) => {
  const stats = {
    totalBids: gameState.bids.length,
    pendingBids: gameState.bids.filter(b => b.status === 'pending').length,
    approvedBids: gameState.leaderboard.length,
    totalRevenue: gameState.leaderboard.reduce((sum, bid) => sum + bid.amount, 0),
    currentSlot: gameState.currentSlot
  };
  res.json(stats);
});

// All other routes should serve the React app (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// --- Socket Logic ---
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Send initial state
  socket.emit('stateUpdate', gameState);

  // 1. Handle New Bid
  socket.on('submitBid', ({ song, amount, user }) => {
    try {
      // Validation
      if (!song || song.trim().length === 0) {
        socket.emit('error', { message: 'Song name is required' });
        return;
      }

      const bidAmount = parseInt(amount);
      if (isNaN(bidAmount) || bidAmount < MIN_BID_AMOUNT) {
        socket.emit('error', { message: `Minimum bid is ₹${MIN_BID_AMOUNT}` });
        return;
      }

      const newBid = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        song: song.trim().substring(0, 100),
        amount: bidAmount,
        user: (user && user.trim()) || 'Anonymous',
        timestamp: Date.now(),
        status: 'pending' // Needs DJ approval
      };

      gameState.bids.push(newBid);
      // Sort bids by amount for internal tracking
      gameState.bids.sort((a, b) => b.amount - a.amount);

      console.log(`📩 New bid: "${newBid.song}" for ₹${newBid.amount} by ${newBid.user}`);

      // Broadcast update to everyone
      io.emit('stateUpdate', gameState);
    } catch (error) {
      console.error('❌ Error in submitBid:', error);
      socket.emit('error', { message: 'Failed to submit bid' });
    }
  });

  // 2. DJ Actions (Approve/Reject/Win)
  socket.on('adminAction', ({ bidId, action }) => {
    try {
      const bidIndex = gameState.bids.findIndex(b => b.id === bidId);
      if (bidIndex === -1) {
        socket.emit('error', { message: 'Bid not found' });
        return;
      }

      if (action === 'approve') {
        gameState.bids[bidIndex].status = 'approved';
        // Recalculate leaderboard
        gameState.leaderboard = gameState.bids
          .filter(b => b.status === 'approved')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10); // Top 10
        console.log(`✅ Bid approved: "${gameState.bids[bidIndex].song}"`);
      } else if (action === 'reject') {
        gameState.bids[bidIndex].status = 'rejected';
        console.log(`❌ Bid rejected: "${gameState.bids[bidIndex].song}"`);
      } else if (action === 'win') {
        // Set as current winner/now playing
        gameState.currentWinner = gameState.bids[bidIndex];
        console.log(`🎵 Now playing: "${gameState.currentWinner.song}"`);
      }

      io.emit('stateUpdate', gameState);
    } catch (error) {
      console.error('❌ Error in adminAction:', error);
      socket.emit('error', { message: 'Failed to perform action' });
    }
  });

  // 3. Reset/Next Slot
  socket.on('adminNextSlot', () => {
    try {
      console.log('📡 Admin triggered next slot');
      nextSlot();
    } catch (error) {
      console.error('❌ Error in adminNextSlot:', error);
      socket.emit('error', { message: 'Failed to start next slot' });
    }
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
  console.log(`⏱️  Slot Duration: ${SLOT_DURATION_MS / 60000} minutes`);
  console.log('');

  // Start the slot timer
  startSlotTimer();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (slotTimer) clearTimeout(slotTimer);
  server.close(() => {
    console.log('HTTP server closed');
  });
});
