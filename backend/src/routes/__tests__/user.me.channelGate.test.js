/**
 * GET /api/user/me ne doit JAMAIS renvoyer activation_id/activation_secret/codes tant
 * qu'aucune chaîne YouTube n'est liée (activation_channels) — vérification côté BACKEND,
 * pas seulement côté frontend (le frontend peut être contourné, l'API non).
 */
const express = require('express');

const FAKE_USER = {
  id: 'user-1', email: 'a@b.com', name: 'Alice', avatar: null,
  plan: 'free', status: 'active', role: 'user',
  quota_used: 0, quota_limit: 10, language: 'fr', created_at: '2026-01-01T00:00:00Z'
};

jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => { req.user = FAKE_USER; next(); }
}));

function buildSupabase({ linked, existingCode }) {
  const activationChannelsChain = {
    select: jest.fn(() => activationChannelsChain),
    eq: jest.fn(() => Promise.resolve({ count: linked ? 1 : 0, error: null }))
  };
  const activationCodesChain = {
    select: jest.fn(() => activationCodesChain),
    eq: jest.fn(() => activationCodesChain),
    order: jest.fn(() => Promise.resolve({ data: existingCode ? [existingCode] : [], error: null })),
    insert: jest.fn(() => activationCodesChain)
  };
  const usersChain = {
    select: jest.fn(() => usersChain),
    update: jest.fn(() => usersChain),
    eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    single: jest.fn(() => Promise.resolve({ data: null, error: null }))
  };
  const connectionLogsChain = { insert: jest.fn(() => Promise.resolve({ data: null, error: null })) };

  return {
    from: jest.fn((table) => {
      if (table === 'activation_channels') return activationChannelsChain;
      if (table === 'activation_codes') return activationCodesChain;
      if (table === 'users') return usersChain;
      if (table === 'connection_logs') return connectionLogsChain;
      throw new Error(`table inattendue dans ce test: ${table}`);
    })
  };
}

async function startApp(supabase) {
  const userRouter = require('../user');
  const app = express();
  app.locals.supabase = supabase;
  app.use('/api/user', userRouter);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

describe('GET /api/user/me — verrouillage activation_id/secret sans chaîne liée', () => {
  afterEach(() => jest.resetModules());

  test('aucune chaîne liée → activation_id/secret/codes absents, youtube_connected:false', async () => {
    const supabase = buildSupabase({
      linked: false,
      existingCode: { activation_id: 'VID123', activation_secret: 'SECRET', subscription_expiry: '2099-01-01T00:00:00Z' }
    });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/user/me`);
    const body = await res.json();
    server.close();

    expect(res.status).toBe(200);
    expect(body.youtube_connected).toBe(false);
    expect(body).not.toHaveProperty('activation_id');
    expect(body).not.toHaveProperty('activation_secret');
    expect(body).not.toHaveProperty('codes');
    // subscription_expiry N'EST PAS gaté : c'est l'abonnement payant, indépendant de YouTube.
    expect(body.subscription_expiry).toBe('2099-01-01T00:00:00Z');
  });

  test('chaîne liée → activation_id/secret/codes présents, youtube_connected:true', async () => {
    const supabase = buildSupabase({
      linked: true,
      existingCode: { activation_id: 'VID123', activation_secret: 'SECRET', subscription_expiry: '2099-01-01T00:00:00Z' }
    });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/user/me`);
    const body = await res.json();
    server.close();

    expect(res.status).toBe(200);
    expect(body.youtube_connected).toBe(true);
    expect(body.activation_id).toBe('VID123');
    expect(body.activation_secret).toBe('SECRET');
    expect(Array.isArray(body.codes)).toBe(true);
  });
});
