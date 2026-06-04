/**
 * VidSpark Backend Server
 * Complete Node.js/Express API with authentication, analysis, and payments
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ============================================
// Security & Performance Middleware
// ============================================

app.use(helmet());
app.use(compression());

// CORS Configuration
app.use(cors({
  origin: [
    'https://vidsparkpro.com',
    'https://www.vidsparkpro.com',
    'https://vidsparkai-au2.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// ============================================
// Request Parsing
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// Logging Middleware
// ============================================

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Authentication Middleware
// ============================================

const { requireAuth } = require('./src/middleware/auth');

// ============================================
// Routes
// ============================================

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const adminRoutes = require('./src/routes/admin');
const analyticsRoutes = require('./src/routes/analytics');

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', requireAuth, userRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.details = err.details;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// ============================================
// Server Startup
// ============================================

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      🚀 VidSpark Backend Started      ║
╠════════════════════════════════════════╣
║ Port:       ${PORT}
║ Environment: ${process.env.NODE_ENV}
║ Time:       ${new Date().toISOString()}
╚════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
