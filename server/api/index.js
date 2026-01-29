// Vercel serverless function entry point for Socket.IO
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeSocketServer } = require('../src/socket');

const app = express();
const httpServer = createServer(app);

// CORS configuration for Vercel deployment
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://fourbyte.vercel.app';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Initialize Socket.IO with Vercel-compatible settings
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST']
  },
  // Critical: Use HTTP long-polling as primary transport for Vercel
  transports: ['polling', 'websocket'],
  // Allow upgrades but don't require WebSocket
  allowUpgrades: true,
  // Increase timeouts for serverless environment
  pingTimeout: 60000,
  pingInterval: 25000,
  // Connection state recovery for reconnections
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Initialize Socket.IO handlers using the existing socket.js logic
initializeSocketServer(httpServer, io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'FOURBYTE server is running',
    transport: 'Socket.IO configured for Vercel'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'FOURBYTE API',
    version: '1.0.0',
    status: 'running',
    socketio: 'enabled'
  });
});

// Socket.IO path for testing
app.get('/socket.io/*', (req, res) => {
  res.json({ info: 'Socket.IO endpoint - use Socket.IO client to connect' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export for Vercel serverless
module.exports = httpServer;
