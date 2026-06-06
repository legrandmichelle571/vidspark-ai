/**
 * VidSpark AI — Backend SaaS
 * Node.js / Express / Supabase
 */
require('dotenv').config();
console.log('SUPABASE_URL =', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY =', process.env.SUPABASE_ANON_KEY);
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression= require('compression');
const morgan     = require('morgan');
const cron       = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const app = express();

/* ── Supabase Admin Client ── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // Service key (admin, server-side only)
);
app.locals.supabase = supabase;

/* ── Middleware ── */
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(morgan('combined'));
/* ── CORS : validation stricte des origines autorisées ── */
const _allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(',').map(o => o.trim()).filter(Boolean) || [];

if (_allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[CORS] ⚠️ ALLOWED_ORIGINS non défini en production — toutes les requêtes cross-origin seront rejetées. Ajouter l\'ID de l\'extension dans ALLOWED_ORIGINS du .env');
  } else {
    console.warn('[CORS] ALLOWED_ORIGINS non défini — toutes origines autorisées en développement');
  }
}

app.use(cors({
  origin: function(origin, callback) {
    /* Requêtes sans origin : Postman, curl, server-to-server → toujours autorisées */
    if (!origin) return callback(null, true);
    /* Développement sans liste configurée → tout autoriser */
    if (_allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (_allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origine non autorisée — ' + origin));
  },
  credentials: true
}));

/* Stripe webhook MUST receive raw body */
app.use(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Rate Limiter global ── */
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

/* ── Routes ── */
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/user',          require('./routes/user'));
app.use('/api/channels',      require('./routes/channels'));
app.use('/api/analysis',      require('./routes/analysis'));
app.use('/api/subscription',  require('./routes/subscription'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/webhook',       require('./routes/webhook'));

/* ── Health check ── */
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

/* ── CRON: Reset quotas gratuits à minuit ── */
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Resetting daily quotas...');
  const { error } = await supabase.rpc('reset_daily_quotas');
  if (error) console.error('[CRON] Error:', error.message);
  else console.log('[CRON] Quotas reset OK');
});

/* ── Start ── */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 VidSpark AI Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
