/**
 * POST /api/auth/google ne doit JAMAIS renvoyer activation_id/activation_secret/codes tant
 * qu'aucune chaîne YouTube n'est liée — même garantie côté backend que /api/user/me
 * (voir user.me.channelGate.test.js), sur le SECOND endpoit qui expose ces champs.
 */
const express = require('express');

const FAKE_AUTH_USER = { id: 'auth-1' };
const FAKE_DB_USER = {
  id: 'user-1', email: 'a@b.com', name: 'Alice', plan: 'free', status: 'active',
  role: 'user', quota_used: 0, quota_limit: 10, language: 'fr'
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: FAKE_AUTH_USER }, error: null })) }
  })
}));

function buildSupabase({ linked, existingCode }) {
  const usersChain = {
    select: jest.fn(() => usersChain),
    update: jest.fn(() => usersChain),
    eq: jest.fn(() => usersChain),
    single: jest.fn(() => Promise.resolve({ data: FAKE_DB_USER, error: null })),
    then: (resolve) => resolve({ data: null, error: null }) // pour l'UPDATE last_login (non déstructuré)
  };
  const activationCodesChain = {
    select: jest.fn(() => activationCodesChain),
    eq: jest.fn(() => activationCodesChain),
    order: jest.fn(() => Promise.resolve({ data: existingCode ? [existingCode] : [], error: null })),
    insert: jest.fn(() => activationCodesChain)
  };
  const activationChannelsChain = {
    select: jest.fn(() => activationChannelsChain),
    eq: jest.fn(() => Promise.resolve({ count: linked ? 1 : 0, error: null }))
  };

  return {
    from: jest.fn((table) => {
      if (table === 'users') return usersChain;
      if (table === 'activation_codes') return activationCodesChain;
      if (table === 'activation_channels') return activationChannelsChain;
      throw new Error(`table inattendue dans ce test: ${table}`);
    })
  };
}

async function startApp(supabase) {
  const authRouter = require('../auth');
  const app = express();
  app.use(express.json());
  app.locals.supabase = supabase;
  app.use('/api/auth', authRouter);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

describe('POST /api/auth/google — verrouillage activation_id/secret sans chaîne liée', () => {
  afterEach(() => jest.resetModules());

  test('aucune chaîne liée → activation_id/secret/codes absents, youtube_connected:false', async () => {
    const supabase = buildSupabase({
      linked: false,
      existingCode: { activation_id: 'VID123', activation_secret: 'SECRET', subscription_expiry: '2099-01-01T00:00:00Z' }
    });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: 'fake-token' })
    });
    const body = await res.json();
    server.close();

    expect(res.status).toBe(200);
    expect(body.youtube_connected).toBe(false);
    expect(body).not.toHaveProperty('activation_id');
    expect(body).not.toHaveProperty('activation_secret');
    expect(body).not.toHaveProperty('codes');
    // subscription_expiry N'EST PAS gaté : c'est l'abonnement payant, indépendant de YouTube.
    expect(body.subscription_expiry).toBe('2099-01-01T00:00:00Z');
    expect(body.user.id).toBe('user-1');
  });

  test('chaîne liée → activation_id/secret/codes présents, youtube_connected:true', async () => {
    const supabase = buildSupabase({
      linked: true,
      existingCode: { activation_id: 'VID123', activation_secret: 'SECRET', subscription_expiry: '2099-01-01T00:00:00Z' }
    });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: 'fake-token' })
    });
    const body = await res.json();
    server.close();

    expect(res.status).toBe(200);
    expect(body.youtube_connected).toBe(true);
    expect(body.activation_id).toBe('VID123');
    expect(body.activation_secret).toBe('SECRET');
  });
});
