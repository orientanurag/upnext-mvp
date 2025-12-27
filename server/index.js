const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for MVP
    methods: ["GET", "POST"]
  }
});

// --- In-Memory State ---
let gameState = {
  currentSlot: {
    id: Date.now(),
    endTime: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    status: 'ACTIVE' // ACTIVE, LOCKED
  },
  bids: [], // { id, amount, song, user, timestamp, status: 'pending'|'approved'|'rejected' }
  leaderboard: [], // Top approved bids
  currentWinner: null // The bid currently being played
};

// --- Socket Logic ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send initial state
  socket.emit('stateUpdate', gameState);

  // 1. Handle New Bid
  socket.on('submitBid', ({ song, amount, user }) => {
    const newBid = {
      id: Date.now().toString(),
      song,
      amount: parseInt(amount) || 0,
      user: user || 'Anonymous',
      timestamp: Date.now(),
      status: 'pending' // Needs DJ approval
    };
    
    gameState.bids.push(newBid);
    // Sort bids by amount just for internal tracking, but leaderboard is for approved only
    gameState.bids.sort((a, b) => b.amount - a.amount);
    
    // Broadcast update to DJ (and everyone for now to show live activity)
    io.emit('stateUpdate', gameState);
  });

  // 2. DJ Actions (Approve/Reject)
  socket.on('adminAction', ({ bidId, action }) => {
    const bidIndex = gameState.bids.findIndex(b => b.id === bidId);
    if (bidIndex === -1) return;

    if (action === 'approve') {
      gameState.bids[bidIndex].status = 'approved';
      // Recalculate leaderboard
      gameState.leaderboard = gameState.bids
        .filter(b => b.status === 'approved')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Top 10
    } else if (action === 'reject') {
      gameState.bids[bidIndex].status = 'rejected';
    } else if (action === 'win') {
        // Set as current winner/now playing
        gameState.currentWinner = gameState.bids[bidIndex];
    }

    io.emit('stateUpdate', gameState);
  });
  
  // 3. Reset/Next Slot
  socket.on('adminNextSlot', () => {
      gameState.bids = [];
      gameState.leaderboard = [];
      gameState.currentWinner = null;
      gameState.currentSlot = {
          id: Date.now(),
          endTime: Date.now() + 5 * 60 * 1000,
          status: 'ACTIVE'
      };
      io.emit('stateUpdate', gameState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
