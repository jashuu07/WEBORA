#!/usr/bin/env node
/**
 * WEBORA migration runner.
 *
 *   DATABASE_URL=postgresql://... node scripts/db-migrate.mjs
 *   npm run db:migrate
 *
 * Applies every *.sql file in database/migrations in filename order, each inside
 * a transaction, and records applied files in public._migrations so repeated
 * runs are no-ops.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'database', 'migrations');

async function loadEnv() {
  // Next loads .env.local automatically; plain node does not. Load it manually.
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await readFile(path.join(process.cwd(), file), 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!match) continue;
        const [, key, value] = match;
        if (process.env[key]) continue;
        process.env[key] = value.replace(/^["']|["']$/g, '');
      }
    } catch {
      // file is optional
    }
  }
}

async function main() {
  await loadEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      '\n✗ DATABASE_URL is not set.\n\n' +
        '  Add it to .env.local (Supabase → Project settings → Database → Connection string):\n' +
        '  DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres\n\n' +
        '  Alternatively, run database/migrations/001_init.sql and 002_seed_templates.sql\n' +
        '  in the Supabase SQL editor — they are idempotent.\n',
    );
    process.exit(1);
  }

  let Client;
  try {
    ({ Client } = await import('pg'));
  } catch {
    console.error('\n✗ The "pg" package is required. Install it with:  npm install pg\n');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    create table if not exists public._migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows } = await client.query('select name from public._migrations');
  const applied = new Set(rows.map((row) => row.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
  let count = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`• ${file} — already applied`);
      continue;
    }
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`→ ${file} … `);
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into public._migrations (name) values ($1)', [file]);
      await client.query('commit');
      count += 1;
      console.log('applied');
    } catch (error) {
      await client.query('rollback');
      console.log('failed');
      console.error(`\n✗ ${file} failed: ${error.message}\n`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(`\n✓ Migrations complete (${count} applied, ${files.length - count} already up to date).\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
