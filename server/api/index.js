// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const { CORS_ORIGIN } = require('../src/config');

const app = express();

// Middleware
app.use(cors({
  origin: CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'FOURBYTE server is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'FOURBYTE API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export for Vercel serverless
module.exports = app;
