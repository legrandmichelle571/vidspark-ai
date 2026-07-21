const { ERROR_CODE_TO_HEALTH, KNOWN_ERROR_CODES } = require('../errorCodes');

describe('errorCodes — source unique consommée par withProviderCall.js et utils/health.js', () => {
  test('chaque code connu a un mapping vers un état de santé (aucun "code fantôme")', () => {
    for (const code of KNOWN_ERROR_CODES) {
      expect(ERROR_CODE_TO_HEALTH[code]).toBeDefined();
    }
  });

  test('KNOWN_ERROR_CODES est dérivé des clés de ERROR_CODE_TO_HEALTH (une seule liste à maintenir)', () => {
    expect([...KNOWN_ERROR_CODES].sort()).toEqual(Object.keys(ERROR_CODE_TO_HEALTH).sort());
  });

  test('les deux exports sont gelés (immutables) — pas de mutation accidentelle à l\'exécution', () => {
    expect(Object.isFrozen(ERROR_CODE_TO_HEALTH)).toBe(true);
    expect(Object.isFrozen(KNOWN_ERROR_CODES)).toBe(true);
  });
});
