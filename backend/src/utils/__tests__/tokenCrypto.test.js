const { encrypt, decrypt, generateKey } = require('../tokenCrypto');

const TEST_KEY = generateKey(); // 32 octets valides, généré une fois pour toute la suite

describe('tokenCrypto', () => {
  test('round-trip encrypt/decrypt restitue le texte original', () => {
    const plaintext = 'ya29.a0AfH6SMB_super_secret_access_token';
    const payload = encrypt(plaintext, TEST_KEY);
    expect(decrypt(payload, TEST_KEY)).toBe(plaintext);
  });

  test('produit un IV différent à chaque appel (pas de réutilisation de nonce)', () => {
    const a = encrypt('same-plaintext', TEST_KEY);
    const b = encrypt('same-plaintext', TEST_KEY);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext); // conséquence directe d'un IV différent en GCM
  });

  test('le ciphertext ne contient jamais le texte en clair', () => {
    const plaintext = 'MON_TOKEN_ULTRA_SECRET';
    const payload = encrypt(plaintext, TEST_KEY);
    expect(payload.ciphertext).not.toContain(plaintext);
  });

  test('échoue si la clé de déchiffrement est différente (intégrité GCM)', () => {
    const payload = encrypt('secret', TEST_KEY);
    const otherKey = generateKey();
    expect(() => decrypt(payload, otherKey)).toThrow();
  });

  test('échoue si le tag d\'authentification a été altéré (détection de falsification)', () => {
    const payload = encrypt('secret', TEST_KEY);
    const tampered = { ...payload, tag: encrypt('other', TEST_KEY).tag };
    expect(() => decrypt(tampered, TEST_KEY)).toThrow();
  });

  test('lève une erreur explicite si CONNECTIONS_ENCRYPTION_KEY est absente', () => {
    expect(() => encrypt('x', undefined)).toThrow(/CONNECTIONS_ENCRYPTION_KEY manquante/);
  });

  test('lève une erreur explicite si la clé ne fait pas 32 octets', () => {
    const shortKey = Buffer.from('trop-court').toString('base64');
    expect(() => encrypt('x', shortKey)).toThrow(/32 octets/);
  });

  test('generateKey() produit toujours une clé valide utilisable par encrypt/decrypt', () => {
    for (let i = 0; i < 5; i++) {
      const key = generateKey();
      const payload = encrypt('probe', key);
      expect(decrypt(payload, key)).toBe('probe');
    }
  });
});
