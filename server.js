/**
 * VidSpark Backend Server - MINIMAL VERSION
 * Lightweight startup to fix 502 errors
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// CORS - ALLOW VIDSPARKPRO.COM
app.use(cors({
  origin: [
    'https://vidsparkpro.com',
    'https://www.vidsparkpro.com',
    'https://vidspark-site.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Placeholder for API routes - will be added incrementally
app.get('/api/auth/me', (req, res) => {
  res.json({ error: 'Not implemented yet' });
});

app.post('/api/auth/google', (req, res) => {
  res.json({ error: 'Not implemented yet' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal error' });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 VidSpark Backend MINIMAL running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
