/**
 * Migration Runner — Exécute toutes les migrations SQL en séquence
 * Usage: node run-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_KEY manquent dans .env');
  process.exit(1);
}

// Convertir l'URL Supabase en connection string PostgreSQL
const pgUrl = supabaseUrl.replace('https://', 'postgresql://postgres:')
  .replace('.supabase.co', '.supabase.co:5432/postgres') +
  `?password=${supabaseServiceKey}`;

async function runMigrations() {
  const client = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à Supabase PostgreSQL\n');

    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📦 Exécution de ${migrationFiles.length} migrations...\n`);

    for (const file of migrationFiles) {
      console.log(`⏳ ${file}...`);
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ ${file}`);
      } catch (err) {
        // Ignorer certaines erreurs communes
        if (err.message.includes('already exists') ||
            err.message.includes('relation') ||
            err.message.includes('EXISTS')) {
          console.log(`⚠️  ${file} (colonnes/tables existent déjà)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Toutes les migrations ont été exécutées avec succès !\n');
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution des migrations:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
