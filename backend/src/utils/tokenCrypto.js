/**
 * Chiffrement au repos des tokens OAuth (access_token / refresh_token de connected_accounts).
 * AES-256-GCM. Clé lue depuis CONNECTIONS_ENCRYPTION_KEY (32 octets encodés en base64),
 * jamais codée en dur. Module autonome : ne dépend d'aucun autre fichier du projet.
 *
 * ⚠️ Phase 1 : n'est appelé par aucune route (aucun Provider OAuth réel n'existe encore).
 * Utilisé uniquement par les tests unitaires pour valider le round-trip chiffrement/déchiffrement.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12; // recommandé pour GCM

function loadKey(envValue = process.env.CONNECTIONS_ENCRYPTION_KEY) {
  if (!envValue) {
    throw new Error(
      'CONNECTIONS_ENCRYPTION_KEY manquante — générer avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }
  const key = Buffer.from(envValue, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`CONNECTIONS_ENCRYPTION_KEY doit encoder exactement ${KEY_BYTES} octets en base64 (reçu ${key.length})`);
  }
  return key;
}

/**
 * @param {string} plaintext
 * @param {string} [envValue]  Clé injectable pour les tests ; sinon lit process.env.
 * @param {string} [aad]  Contexte lié au ciphertext (ex: `${userId}:${platform}:${externalId}`).
 *   Optionnel mais recommandé dès la Phase 3 : sans lui, un attaquant avec un accès en écriture
 *   à la table pourrait copier le ciphertext d'une ligne vers une autre (même clé, même
 *   round-trip) sans que decrypt() ne le détecte — GCM authentifie l'intégrité du ciphertext,
 *   pas son appartenance à telle ligne. Avec aad, decrypt() échoue si le contexte ne correspond
 *   pas à celui utilisé au chiffrement.
 * @returns {{ ciphertext: string, iv: string, tag: string }} — tout en base64, stockable tel quel
 */
function encrypt(plaintext, envValue, aad) {
  if (plaintext == null) throw new Error('encrypt() : plaintext requis');
  const key = loadKey(envValue);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  if (aad) cipher.setAAD(Buffer.from(String(aad), 'utf8'));
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

/**
 * @param {{ ciphertext: string, iv: string, tag: string }} payload
 * @param {string} [envValue]
 * @param {string} [aad]  DOIT être exactement le même contexte que celui passé à encrypt(),
 *   sinon la vérification d'intégrité échoue (comportement voulu).
 * @returns {string} plaintext original
 */
function decrypt(payload, envValue, aad) {
  // == null (pas !x) : un ciphertext vide ("") est valide pour un plaintext vide — seul
  // l'absence réelle (null/undefined) du champ doit être rejetée. Bug trouvé pendant l'audit :
  // la version précédente traitait "" comme "manquant" et rejetait à tort le round-trip d'un
  // plaintext vide.
  if (!payload || payload.ciphertext == null || payload.iv == null || payload.tag == null) {
    throw new Error('decrypt() : payload incomplet (ciphertext/iv/tag requis)');
  }
  const key = loadKey(envValue);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'base64'));
  if (aad) decipher.setAAD(Buffer.from(String(aad), 'utf8'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

/** Génère une clé valide (32 octets, base64) — utilitaire pour la génération initiale/les tests. */
function generateKey() {
  return crypto.randomBytes(KEY_BYTES).toString('base64');
}

module.exports = { encrypt, decrypt, generateKey, ALGORITHM };
