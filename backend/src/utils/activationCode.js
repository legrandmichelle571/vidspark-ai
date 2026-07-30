/**
 * Génération des identifiants d'activation (ID + Secret de l'extension).
 *
 * Aléa cryptographique obligatoire : ces deux valeurs sont l'unique preuve
 * d'identité des appels de l'extension (voir routes/activation.js, qui
 * authentifie chaque requête par un couple activation_id/activation_secret).
 * Un PRNG prévisible comme Math.random() rendrait un secret forgeable à partir
 * d'un autre secret observé.
 *
 * Ce module existe pour qu'il n'y ait qu'UNE implémentation : la version
 * Math.random() avait survécu dans routes/user.js après le durcissement de
 * routes/auth.js (a873bc3), et les codes créés par GET /user/me restaient donc
 * faibles. Tout nouvel appelant doit importer d'ici.
 *
 * Format hex MAJUSCULE conservé (compatible casse / copier-coller).
 */
const crypto = require('crypto');

function generateActivationId() {
  return 'VID' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(5).toString('hex').toUpperCase();
}

function generateActivationSecret() {
  return crypto.randomBytes(16).toString('hex').toUpperCase(); // 128 bits
}

module.exports = { generateActivationId, generateActivationSecret };
