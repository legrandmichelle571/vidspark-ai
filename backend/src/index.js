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

/* ── Proxy Railway : indispensable pour express-rate-limit (X-Forwarded-For) ── */
app.set('trust proxy', 1);

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
const _defaultOrigins = [
  'https://vidspark-site.pages.dev',
  'https://vidsparkpro.com',
  'https://www.vidsparkpro.com',
  'http://localhost:3000',
  'http://localhost:8000',
  'https://www.youtube.com'
];
const _allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(',').map(o => o.trim()).filter(Boolean) || _defaultOrigins;

if (_allowedOrigins.length === 0) {
  console.warn('[CORS] ⚠️ ALLOWED_ORIGINS vide — utilisant les domaines par défaut');
}

/* ID(s) d'extension Chrome autorisés — remplace l'ancien "tout chrome-extension://*"
   (n'importe quelle extension installée pouvait auparavant appeler cette API).
   ID de production : https://chromewebstore.google.com/detail/vidspark-ai/ojahpkeponimlmfokadlijbajooeejbk
   ID(s) de dev additionnels via ALLOWED_EXTENSION_IDS (jamais en dur avec la prod). */
const _defaultExtensionIds = ['ojahpkeponimlmfokadlijbajooeejbk'];
const _allowedExtensionIds = process.env.ALLOWED_EXTENSION_IDS
  ?.split(',').map(o => o.trim()).filter(Boolean) || _defaultExtensionIds;

app.use(cors({
  origin: function(origin, callback) {
    /* Requêtes sans origin : Postman, curl, server-to-server → toujours autorisées */
    if (!origin) return callback(null, true);
    /* Fichier local (file://) : tableau de bord de commande — protégé par la clé admin */
    if (origin === 'null') return callback(null, true);
    /* Extension Chrome : uniquement les ID explicitement autorisés (voir _allowedExtensionIds) */
    if (origin.startsWith('chrome-extension://')) {
      const extensionId = origin.replace('chrome-extension://', '');
      if (_allowedExtensionIds.includes(extensionId)) return callback(null, true);
      if (process.env.NODE_ENV === 'development') return callback(null, true);
      return callback(new Error('CORS: extension non autorisée — ' + extensionId));
    }
    /* Toujours autoriser YouTube (l'extension appelle l'API depuis les pages YouTube) */
    if (/^https?:\/\/([a-z0-9-]+\.)?youtube\.com$/.test(origin)) return callback(null, true);
    /* Vérifier si origin est dans la liste */
    if (_allowedOrigins.includes(origin)) return callback(null, true);
    /* Autoriser tout UNIQUEMENT en dev explicite (NODE_ENV=development).
       En prod OU si NODE_ENV est absent → strict : seules les origines de
       _defaultOrigins / ALLOWED_ORIGINS (qui incluent déjà les domaines du
       site + localhost) sont acceptées. Évite un CORS grand ouvert si
       NODE_ENV n'est pas positionné sur l'hôte. */
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('CORS: origine non autorisée — ' + origin));
  },
  credentials: true
}));

/* Stripe webhook MUST receive raw body */
app.use(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' })
);

app.use(express.json({ limit: '6mb' }));   // 6mb : permet l'envoi de miniatures (A/B Vision)
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

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
app.use('/api/public',        require('./routes/public'));
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/user',          require('./routes/user'));
app.use('/api/activation',    require('./routes/activation'));
app.use('/api/auth/link',     require('./routes/extensionPairing')); // chemin neutre, voir routes/extensionPairing.js
app.use('/api/channels',      require('./routes/channels'));
app.use('/api/diamant',       require('./routes/diamant'));
app.use('/api/analysis',      require('./routes/analysis'));
app.use('/api/subscription',  require('./routes/subscription'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/story',          require('./routes/story'));
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
