const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { initializeSocketServer } = require('./socket');
const { PORT, CORS_ORIGIN } = require('./config');

const app = express();
const server = http.createServer(app);

// SECURITY: Helmet adds secure HTTP headers
app.use(helmet({
  // Allow Socket.IO and WebSocket connections
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // SECURITY: Limit JSON body size

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
const io = initializeSocketServer(server);

// SECURITY: Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  
  // Close Socket.IO connections
  io.close(() => {
    console.log('[Server] Socket.IO connections closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  console.log(`FOURBYTE server running on port ${PORT}`);
});

module.exports = { app, server };
