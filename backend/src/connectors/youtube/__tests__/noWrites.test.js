/**
 * Preuve par analyse statique — pas seulement par confiance dans les tests dynamiques —
 * qu'aucune écriture SQL n'est possible depuis le Provider YouTube. Si un futur
 * contributeur ajoute par erreur un `.insert(`/`.update(`/`.delete(`/`.upsert(` dans ce
 * dossier, CE test échoue immédiatement, indépendamment de tout scénario de test dynamique.
 */
const fs = require('fs');
const path = require('path');

const CONNECTOR_DIR = path.join(__dirname, '..');
const WRITE_PATTERNS = [/\.insert\s*\(/, /\.update\s*\(/, /\.delete\s*\(/, /\.upsert\s*\(/, /DROP\s+TABLE/i, /DELETE\s+FROM/i];

function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue; // les tests eux-mêmes contiennent des .insert() factices (mocks)
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

describe('Provider YouTube — aucune écriture SQL possible (analyse statique)', () => {
  const files = listSourceFiles(CONNECTOR_DIR);

  test('le dossier connectors/youtube/ contient bien des fichiers à analyser (le test n\'est pas vide par accident)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(files.map((f) => [path.relative(CONNECTOR_DIR, f)]))('%s ne contient aucun verbe d\'écriture SQL', (relPath) => {
    const source = fs.readFileSync(path.join(CONNECTOR_DIR, relPath), 'utf8');
    for (const pattern of WRITE_PATTERNS) {
      expect(source).not.toMatch(pattern);
    }
  });

  test('la seule requête Supabase sur activation_channels est un .select() (reader.js)', () => {
    const readerSource = fs.readFileSync(path.join(CONNECTOR_DIR, 'reader.js'), 'utf8');
    expect(readerSource).toMatch(/\.from\(\s*['"]activation_channels['"]\s*\)\s*[\s\S]*?\.select\(/);
  });
});
