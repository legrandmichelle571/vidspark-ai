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

  test('rejette un plaintext null ou undefined (évite de chiffrer "null" par erreur)', () => {
    expect(() => encrypt(null, TEST_KEY)).toThrow(/plaintext requis/);
    expect(() => encrypt(undefined, TEST_KEY)).toThrow(/plaintext requis/);
  });

  test('accepte une chaîne vide comme plaintext valide (distinct de null/undefined)', () => {
    const payload = encrypt('', TEST_KEY);
    expect(decrypt(payload, TEST_KEY)).toBe('');
  });

  describe('AAD (contexte lié au ciphertext)', () => {
    test('round-trip réussit quand le même contexte est fourni au chiffrement et au déchiffrement', () => {
      const payload = encrypt('secret', TEST_KEY, 'user-1:tiktok:acc-1');
      expect(decrypt(payload, TEST_KEY, 'user-1:tiktok:acc-1')).toBe('secret');
    });

    test('échoue si le contexte diffère — empêche un ciphertext copié vers une autre ligne d\'être déchiffré', () => {
      const payload = encrypt('secret', TEST_KEY, 'user-1:tiktok:acc-1');
      expect(() => decrypt(payload, TEST_KEY, 'user-2:tiktok:acc-2')).toThrow();
    });

    test('échoue si le contexte est fourni au déchiffrement mais absent au chiffrement (ou l\'inverse)', () => {
      const payload = encrypt('secret', TEST_KEY); // pas d'aad
      expect(() => decrypt(payload, TEST_KEY, 'user-1:tiktok:acc-1')).toThrow();
    });
  });
});
