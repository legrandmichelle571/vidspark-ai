const { readActivationChannels } = require('../reader');

/** Construit un client Supabase factice, chaînable, qui enregistre chaque appel. */
function makeSupabaseStub({ data = [], error = null } = {}) {
  const calls = { from: [], select: [], eq: [], order: [] };
  const chain = {
    select: jest.fn((...args) => { calls.select.push(args); return chain; }),
    eq: jest.fn((...args) => { calls.eq.push(args); return chain; }),
    order: jest.fn((...args) => { calls.order.push(args); return Promise.resolve({ data, error }); }),
    // Méthodes d'écriture présentes UNIQUEMENT pour prouver qu'elles ne sont jamais appelées.
    insert: jest.fn(), update: jest.fn(), delete: jest.fn(), upsert: jest.fn()
  };
  const supabase = { from: jest.fn((...args) => { calls.from.push(args); return chain; }) };
  return { supabase, chain, calls };
}

describe('readActivationChannels', () => {
  test('interroge exactement activation_channels avec les mêmes colonnes/filtre/tri que GET /api/user/channels', async () => {
    const { supabase, chain } = makeSupabaseStub({ data: [{ channel_id: 'UC1', channel_name: 'Ma Chaîne', created_at: '2026-01-01T00:00:00Z' }] });

    await readActivationChannels(supabase, 'user-42');

    expect(supabase.from).toHaveBeenCalledWith('activation_channels');
    expect(chain.select).toHaveBeenCalledWith('channel_id, channel_name, created_at');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-42');
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  test('renvoie les lignes telles quelles (aucune transformation à ce niveau)', async () => {
    const rows = [
      { channel_id: 'UC1', channel_name: 'Chaîne A', created_at: '2026-01-01T00:00:00Z' },
      { channel_id: 'UC2', channel_name: 'Chaîne B', created_at: '2026-01-02T00:00:00Z' }
    ];
    const { supabase } = makeSupabaseStub({ data: rows });
    await expect(readActivationChannels(supabase, 'user-1')).resolves.toEqual(rows);
  });

  test('renvoie un tableau vide (jamais null/undefined) si data est null', async () => {
    const { supabase } = makeSupabaseStub({ data: null });
    await expect(readActivationChannels(supabase, 'user-1')).resolves.toEqual([]);
  });

  test('lève une erreur classifiée PROVIDER_DOWN si Supabase renvoie une erreur', async () => {
    const { supabase } = makeSupabaseStub({ error: { message: 'connexion refusée' } });
    await expect(readActivationChannels(supabase, 'user-1')).rejects.toMatchObject({ code: 'PROVIDER_DOWN' });
  });

  test('fournit un message par défaut si l\'erreur Supabase n\'a pas de .message', async () => {
    const { supabase } = makeSupabaseStub({ error: {} });
    await expect(readActivationChannels(supabase, 'user-1')).rejects.toMatchObject({
      code: 'PROVIDER_DOWN', message: 'Erreur de lecture activation_channels'
    });
  });

  test('n\'appelle JAMAIS insert/update/delete/upsert, quel que soit le scénario', async () => {
    const scenarios = [
      makeSupabaseStub({ data: [{ channel_id: 'UC1', channel_name: 'X', created_at: 'now' }] }),
      makeSupabaseStub({ data: [] }),
      makeSupabaseStub({ error: { message: 'boom' } })
    ];
    for (const { supabase, chain } of scenarios) {
      try { await readActivationChannels(supabase, 'user-1'); } catch (e) { /* attendu pour le 3e cas */ }
      expect(chain.insert).not.toHaveBeenCalled();
      expect(chain.update).not.toHaveBeenCalled();
      expect(chain.delete).not.toHaveBeenCalled();
      expect(chain.upsert).not.toHaveBeenCalled();
    }
  });

  test('exige un supabaseClient et un userId (erreurs explicites plutôt qu\'un crash silencieux)', async () => {
    await expect(readActivationChannels(null, 'user-1')).rejects.toThrow(/supabaseClient requis/);
    const { supabase } = makeSupabaseStub();
    await expect(readActivationChannels(supabase, null)).rejects.toThrow(/userId requis/);
  });
});
