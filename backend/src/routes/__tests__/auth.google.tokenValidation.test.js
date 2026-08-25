/**
 * POST /api/auth/google — la validation du token doit suivre la même stratégie
 * de clé Supabase que requireAuth (middleware/auth.js, utilisé par ex. par
 * /user/channels) : SUPABASE_SERVICE_KEY en priorité, SUPABASE_ANON_KEY en repli.
 *
 * Reproduit le scénario du diagnostic DIAGNOSTIC_401_AUTHGOOGLE.md : la même
 * requête réussissait sur /user/channels (200) et échouait sur /auth/google (401)
 * car /auth/google validait le token avec un client construit sur ANON_KEY
 * uniquement, quel que soit l'état de SERVICE_KEY.
 */
const express = require('express');

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url, key) => ({
    auth: {
      getUser: jest.fn((token) => {
        // Simule une SUPABASE_ANON_KEY invalide/révoquée côté Supabase : seule
        // la SERVICE_KEY valide correctement un token par ailleurs valide.
        if (key === 'test-service-key' && token === 'valid-session-token') {
          return Promise.resolve({ data: { user: { id: 'auth-1' } }, error: null });
        }
        return Promise.resolve({ data: { user: null }, error: { message: 'Invalid or expired token' } });
      })
    }
  }))
}));

const FAKE_DB_USER = {
  id: 'user-1', email: 'a@b.com', name: 'Alice', plan: 'free', status: 'active',
  role: 'user', quota_used: 0, quota_limit: 10, language: 'fr'
};

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

describe('POST /api/auth/google — stratégie de clé de validation du token', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_KEY: 'test-service-key'
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  test('ANON_KEY invalide côté Supabase mais SERVICE_KEY valide + token valide → 200 (non-régression du bug diagnostiqué)', async () => {
    const supabase = buildSupabase({ linked: false, existingCode: null });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: 'valid-session-token' })
    });
    const body = await res.json();
    server.close();

    expect(res.status).toBe(200);
    expect(body.user.id).toBe('user-1');
  });

  test('token réellement invalide (rejeté même avec SERVICE_KEY configurée) → 401 "Token invalide ou expiré"', async () => {
    const supabase = buildSupabase({ linked: false, existingCode: null });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: 'bad-token' })
    });
    const body = await res.json();
    server.close();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Token invalide ou expiré');
  });

  test('aucun token fourni → 400', async () => {
    const supabase = buildSupabase({ linked: false, existingCode: null });
    const server = await startApp(supabase);
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    server.close();

    expect(res.status).toBe(400);
  });
});
