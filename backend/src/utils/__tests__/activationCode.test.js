/**
 * Les identifiants d'activation authentifient à eux seuls tous les appels de
 * l'extension : leur imprévisibilité est une propriété de sécurité, pas un
 * détail d'implémentation. Ces tests échouent si quelqu'un revient à un PRNG
 * non cryptographique (Math.random), ce qui s'était déjà produit dans
 * routes/user.js.
 */
const { generateActivationId, generateActivationSecret } = require('../activationCode');

describe('génération des identifiants d’activation', () => {
  test('le secret fait 128 bits en hexadécimal majuscule', () => {
    const secret = generateActivationSecret();
    expect(secret).toMatch(/^[0-9A-F]{32}$/);
  });

  test('l’ID garde le préfixe VID et n’est composé que de caractères sûrs', () => {
    const id = generateActivationId();
    expect(id.startsWith('VID')).toBe(true);
    expect(id).toMatch(/^VID[0-9A-Z]+$/);
  });

  test('aucune collision sur 5 000 tirages', () => {
    const ids = new Set();
    const secrets = new Set();
    for (let i = 0; i < 5000; i++) {
      ids.add(generateActivationId());
      secrets.add(generateActivationSecret());
    }
    expect(ids.size).toBe(5000);
    expect(secrets.size).toBe(5000);
  });

  /* Math.random() est semé par le processus : deux tirages successifs partagent
     de l'état. Ce contrôle ne prouve pas la qualité cryptographique, mais il
     attrape un retour en arrière évident (troncature, alphabet réduit, valeur
     dérivée de l'horloge seule). */
  test('les secrets utilisent tout l’alphabet hexadécimal', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
      for (const ch of generateActivationSecret()) seen.add(ch);
    }
    expect(seen.size).toBe(16);
  });

  test('routes/user.js et routes/auth.js n’ont plus de générateur local', () => {
    const fs = require('fs');
    const path = require('path');
    for (const file of ['user.js', 'auth.js']) {
      const src = fs.readFileSync(path.join(__dirname, '..', '..', 'routes', file), 'utf8');
      const code = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');   // hors commentaires
      expect(code.includes('Math.random')).toBe(false);
    }
  });
});
