require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// ✅ Safe import (prevents crash if file missing)
let messageRoutes;
try {
  messageRoutes = require('./routes/messages');
} catch (err) {
  console.error("❌ Route file error:", err.message);
}

const app = express();
const server = http.createServer(app);

// ✅ Debug ENV (IMPORTANT)
console.log("🔍 MONGO_URI:", process.env.MONGO_URI ? "Loaded ✅" : "Missing ❌");
console.log("🔍 CLIENT_URL:", process.env.CLIENT_URL);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'DELETE', 'PATCH']
  }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Attach io to requests
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes (only if loaded)
if (messageRoutes) {
  app.use('/api/messages', messageRoutes);
}

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'Chat API running 🚀' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ✅ MongoDB connection + server start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});
