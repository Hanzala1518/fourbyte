const express = require('express');
const http = require('http');
const cors = require('cors');
const { initializeSocketServer } = require('./socket');
const { PORT, CORS_ORIGIN } = require('./config');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
initializeSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`FOURBYTE server running on port ${PORT}`);
});

module.exports = { app, server };
