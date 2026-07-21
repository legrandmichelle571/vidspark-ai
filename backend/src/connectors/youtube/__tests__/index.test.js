const { manifest, fetchProfile, listAccounts, tasks } = require('../index');
const { assertValidProvider } = require('../../base/contract');
const { computeHealth } = require('../../../utils/health');

function makeSupabaseStub(rows) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error: null }),
    insert: jest.fn(), update: jest.fn(), delete: jest.fn()
  };
  return { from: jest.fn().mockReturnValue(chain) };
}

const SAMPLE_ROWS = [
  { channel_id: 'UC_AAA', channel_name: 'Chaîne Alpha', created_at: '2026-01-01T00:00:00Z' },
  { channel_id: 'UC_BBB', channel_name: 'Chaîne Beta', created_at: '2026-01-02T00:00:00Z' }
];

describe('Provider YouTube — respecte le contrat de la Phase 1', () => {
  test('le manifest + l\'implémentation passent la validation générique du socle', () => {
    expect(() => assertValidProvider({ manifest, fetchProfile, tasks }, 'youtube')).not.toThrow();
  });

  test('auth.type est "none" — aucun jeton OAuth manipulé, aucune clé additionnelle requise', () => {
    expect(manifest.auth.type).toBe('none');
    expect(manifest.auth.scopesAvailable).toBeUndefined();
  });
});

describe('listAccounts — équivalence stricte avec les données actuelles', () => {
  test('traduit chaque ligne activation_channels sans perte ni altération d\'information', async () => {
    const supabaseClient = makeSupabaseStub(SAMPLE_ROWS);
    const accounts = await listAccounts('user-1', { supabaseClient });

    expect(accounts).toEqual([
      { externalId: 'UC_AAA', externalName: 'Chaîne Alpha', avatarUrl: null },
      { externalId: 'UC_BBB', externalName: 'Chaîne Beta', avatarUrl: null }
    ]);
  });

  test('conserve l\'ordre renvoyé par la requête (created_at ascendant, comme le dashboard actuel)', async () => {
    const supabaseClient = makeSupabaseStub(SAMPLE_ROWS);
    const accounts = await listAccounts('user-1', { supabaseClient });
    expect(accounts.map((a) => a.externalId)).toEqual(['UC_AAA', 'UC_BBB']);
  });

  test('gère le multi-compte : N chaînes → N comptes (aucune limite imposée par le Provider lui-même)', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ channel_id: `UC${i}`, channel_name: `Chaîne ${i}`, created_at: `2026-01-0${i + 1}T00:00:00Z` }));
    const supabaseClient = makeSupabaseStub(many);
    const accounts = await listAccounts('user-1', { supabaseClient });
    expect(accounts).toHaveLength(5);
  });

  test('aucune chaîne connectée → tableau vide (pas une erreur)', async () => {
    const supabaseClient = makeSupabaseStub([]);
    await expect(listAccounts('user-1', { supabaseClient })).resolves.toEqual([]);
  });

  test('erreur explicite si supabaseClient n\'est pas fourni (pas de crash silencieux)', async () => {
    await expect(listAccounts('user-1', {})).rejects.toThrow(/supabaseClient requis/);
  });

  test('utilise channel_id comme externalName de repli si channel_name est vide (comme user.js: channel_name || channel_id)', async () => {
    const supabaseClient = makeSupabaseStub([{ channel_id: 'UC_X', channel_name: null, created_at: 'now' }]);
    const accounts = await listAccounts('user-1', { supabaseClient });
    expect(accounts[0].externalName).toBe('UC_X');
  });
});

describe('fetchProfile — compatibilité avec le contrat (capabilities.profile ⇒ fetchProfile requis)', () => {
  test('renvoie le premier compte (le plus ancien)', async () => {
    const supabaseClient = makeSupabaseStub(SAMPLE_ROWS);
    const profile = await fetchProfile('user-1', { supabaseClient });
    expect(profile.externalId).toBe('UC_AAA');
  });

  test('renvoie null si aucune chaîne n\'est connectée', async () => {
    const supabaseClient = makeSupabaseStub([]);
    await expect(fetchProfile('user-1', { supabaseClient })).resolves.toBeNull();
  });
});

describe('Observabilité — réutilise EXACTEMENT le socle Phase 1, sans implémentation spécifique', () => {
  test('un échec de lecture passe par withProviderCall (classification + journalisation génériques)', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB indisponible' } })
    };
    const supabaseClient = { from: jest.fn().mockReturnValue(chain) };
    const logEvent = jest.fn().mockResolvedValue(undefined);
    const recordError = jest.fn().mockResolvedValue(undefined);

    await expect(listAccounts('user-1', { supabaseClient, observability: { logEvent, recordError } })).rejects.toThrow();

    expect(recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'PROVIDER_DOWN' }));
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ platform: 'youtube', eventType: 'sync_profile_error' }));
  });

  test('la tâche déclarée "syncProfile" est réellement exécutable et appelle la même logique que listAccounts', async () => {
    const supabaseClient = makeSupabaseStub(SAMPLE_ROWS);
    const result = await tasks.syncProfile('user-1', { supabaseClient });
    expect(result).toHaveLength(2);
  });

  test('la santé se calcule avec la fonction générique computeHealth du socle, sans getHealth spécifique', () => {
    // Preuve directe : ce Provider n'exporte PAS getHealth (vérifié ci-dessous), et pourtant
    // computeHealth() générique produit un résultat correct pour un compte "auth.type=none".
    expect(require('../index').getHealth).toBeUndefined();

    const connectedAccount = { status: 'active' }; // pas de tokenExpiresAt : non pertinent sans OAuth
    expect(computeHealth(connectedAccount, manifest)).toBe('connected');
    expect(computeHealth(null, manifest)).toBe('disconnected');
    expect(computeHealth({ status: 'revoked' }, manifest)).toBe('disconnected');
  });
});

describe('Indépendance vis-à-vis du module Providers (flag de désactivation)', () => {
  const ORIGINAL = process.env.CONNECTIONS_MODULE_ENABLED;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.CONNECTIONS_MODULE_ENABLED;
    else process.env.CONNECTIONS_MODULE_ENABLED = ORIGINAL;
  });

  test('produit le même résultat que CONNECTIONS_MODULE_ENABLED soit absent, "false" ou "true"', async () => {
    const supabaseClient = makeSupabaseStub(SAMPLE_ROWS);

    delete process.env.CONNECTIONS_MODULE_ENABLED;
    const withoutFlag = await listAccounts('user-1', { supabaseClient: makeSupabaseStub(SAMPLE_ROWS) });

    process.env.CONNECTIONS_MODULE_ENABLED = 'false';
    const flagFalse = await listAccounts('user-1', { supabaseClient: makeSupabaseStub(SAMPLE_ROWS) });

    process.env.CONNECTIONS_MODULE_ENABLED = 'true';
    const flagTrue = await listAccounts('user-1', { supabaseClient: makeSupabaseStub(SAMPLE_ROWS) });

    expect(withoutFlag).toEqual(flagFalse);
    expect(flagFalse).toEqual(flagTrue);
  });
});
