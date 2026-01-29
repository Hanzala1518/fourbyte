/**
 * IMPORTANT: Vercel Serverless CANNOT run Socket.IO
 * 
 * Why this doesn't work:
 * 1. Vercel functions are stateless - they don't maintain connections
 * 2. Vercel functions timeout after 10 seconds
 * 3. Socket.IO requires persistent WebSocket/polling connections
 * 4. Each Socket.IO request hits a DIFFERENT serverless instance
 * 
 * This file provides a basic health check, but Socket.IO will NOT work.
 * You MUST deploy to Railway, Render, or another platform that supports
 * long-running processes for Socket.IO to function.
 */

const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://fourbyte.vercel.app';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'error',
    message: 'Socket.IO cannot run on Vercel serverless',
    solution: 'Deploy to Railway (railway.app) or Render (render.com)',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    error: 'Socket.IO not available',
    message: 'Vercel serverless functions cannot maintain WebSocket connections',
    alternatives: [
      'Railway: https://railway.app (recommended - $5/month)',
      'Render: https://render.com (free tier available)',
      'Fly.io: https://fly.io (free tier available)'
    ]
  });
});

// Socket.IO endpoints will fail
app.all('/socket.io/*', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Socket.IO cannot run on Vercel serverless architecture',
    reason: 'Serverless functions are stateless and timeout after 10 seconds',
    solution: 'Deploy server to Railway, Render, or Fly.io'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Export for Vercel
module.exports = app;
