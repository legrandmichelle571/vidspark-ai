/**
 * Garde-fou de démarrage.
 *
 * Express refuse un middleware `undefined` au moment du `require` : si un fichier
 * de routes déstructure un middleware que `middleware/auth.js` n'exporte pas (faute
 * de frappe, export oublié), le routeur entier lève à l'import — et tout l'espace
 * d'URL qu'il porte disparaît au démarrage du serveur. C'est exactement le cas de
 * `routes/analytics.js` (`optionalAuth` n'est exporté nulle part) : le monter
 * ferait échouer le démarrage du backend complet.
 *
 * Ce test charge chaque routeur réellement monté par src/index.js et vérifie que
 * l'ensemble est importable, non vide et sans chemin dupliqué. Il échoue aussi si
 * un nouveau fichier de routes chargeable reste non monté (route inatteignable).
 */
const fs = require('fs');
const path = require('path');

/* Certains modules construisent leur client Supabase à l'import (et non à la
   première requête) : sans ces variables, 10 des 12 routeurs lèvent « supabaseUrl
   is required » avant même d'être inspectés. Valeurs factices : construire un
   client n'ouvre aucune connexion, et aucune requête n'est émise ici. */
process.env.SUPABASE_URL         = process.env.SUPABASE_URL         || 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY    || 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';

const ROUTES_DIR = path.join(__dirname, '..');
const INDEX = fs.readFileSync(path.join(__dirname, '..', '..', 'index.js'), 'utf8');

/* Liste des montages telle qu'elle est écrite dans index.js */
const mounts = [...INDEX.matchAll(/app\.use\('(\/api\/[a-z-]+)',\s*require\('\.\/routes\/([a-z]+)'\)\)/g)]
  .map(m => ({ prefix: m[1], file: m[2] }));

const routeFiles = fs.readdirSync(ROUTES_DIR)
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace(/\.js$/, ''));

function load(file) {
  try { return { router: require(path.join(ROUTES_DIR, file + '.js')) }; }
  catch (err) { return { err }; }
}

describe('montage des routeurs (src/index.js)', () => {
  test('index.js déclare bien des montages', () => {
    expect(mounts.length).toBeGreaterThan(0);
  });

  test('chaque routeur monté est importable et expose au moins une route', () => {
    const broken = [];
    const empty = [];
    for (const { prefix, file } of mounts) {
      const { router, err } = load(file);
      if (err) { broken.push(`${file} (${prefix}) : ${err.message}`); continue; }
      const stack = (router && router.stack) || [];
      const routes = stack.filter(l => l.route);
      if (!routes.length) empty.push(`${file} (${prefix})`);
    }
    expect(broken).toEqual([]);
    expect(empty).toEqual([]);
  });

  test('aucun chemin dupliqué à l’intérieur d’un même routeur', () => {
    const dups = [];
    for (const { prefix, file } of mounts) {
      const { router, err } = load(file);
      if (err) continue;                        // déjà signalé par le test précédent
      const seen = new Set();
      for (const layer of (router.stack || [])) {
        if (!layer.route) continue;
        for (const method of Object.keys(layer.route.methods)) {
          const key = `${method.toUpperCase()} ${layer.route.path}`;
          if (seen.has(key)) dups.push(`${file} : ${key}`);
          seen.add(key);
        }
      }
    }
    expect(dups).toEqual([]);
  });

  test('tout fichier de routes importable est monté', () => {
    const loadable = routeFiles.filter(f => !load(f).err);
    const mountedFiles = mounts.map(m => m.file);
    const orphans = loadable.filter(f => !mountedFiles.includes(f));
    expect(orphans).toEqual([]);
  });

  /* Pinning : documente un défaut connu. Le jour où analytics.js devient
     importable (optionalAuth exporté), ce test échoue — signal qu'il faut le
     monter dans index.js, ou le supprimer. */
  test('analytics.js n’est pas importable, et n’est donc pas monté', () => {
    const { err } = load('analytics');
    expect(err).toBeDefined();
    expect(mounts.map(m => m.file)).not.toContain('analytics');
  });
});
