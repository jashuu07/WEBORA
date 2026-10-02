#!/usr/bin/env node
/**
 * WEBORA environment doctor.
 *
 *   npm run setup
 *
 * Reports exactly what is configured on this deployment — the same facts the
 * app surfaces in Dashboard → Settings. Nothing here is required for the app to
 * run: WEBORA works out of the box on the local driver with the local engine.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();

async function loadEnv() {
  const loaded = [];
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await readFile(path.join(cwd, file), 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!match) continue;
        const [, key, value] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = value.replace(/^["']|["']$/g, '');
        loaded.push(key);
      }
    } catch {
      /* optional */
    }
  }
  return loaded;
}

function line(label, ok, detail) {
  const mark = ok === true ? '✓' : ok === false ? '○' : '•';
  const colour = ok === true ? '\x1b[32m' : ok === false ? '\x1b[90m' : '\x1b[33m';
  console.log(`${colour}${mark}\x1b[0m ${label.padEnd(34)} ${detail}`);
}

async function main() {
  const loadedKeys = await loadEnv();

  console.log('\nWEBORA — environment check\n' + '─'.repeat(72));

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  line('Node.js', nodeMajor >= 20, `${process.versions.node}${nodeMajor >= 20 ? '' : '  (20.9+ recommended)'}`);
  line('Environment files', loadedKeys.length > 0, loadedKeys.length ? `.env.local loaded (${loadedKeys.length} keys)` : 'none found — defaults will be used');

  const storageDriver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  line(
    'Storage driver',
    null,
    storageDriver === 'supabase' && supabaseReady
      ? 'supabase — PostgreSQL'
      : storageDriver === 'supabase'
        ? 'supabase requested but credentials missing → falling back to local'
        : 'local — .data/webora.json (zero config)',
  );
  line('Supabase URL', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set (optional)');
  line('Supabase service key', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set (optional)');
  line('DATABASE_URL (migrations)', Boolean(process.env.DATABASE_URL), process.env.DATABASE_URL ? 'set' : 'not set — see database/README.md');

  const provider = process.env.AI_PROVIDER;
  const aiKey = process.env.AI_API_KEY;
  line(
    'AI provider',
    provider && aiKey ? true : null,
    provider && aiKey
      ? `${provider} · ${process.env.AI_MODEL ?? 'default model'} — copy will be model-written`
      : 'not configured — using the WEBORA local engine (deterministic, offline)',
  );

  const authSecret = process.env.AUTH_SECRET;
  line(
    'AUTH_SECRET',
    Boolean(authSecret && authSecret !== 'change-me-to-a-long-random-string'),
    authSecret && authSecret !== 'change-me-to-a-long-random-string'
      ? 'set'
      : 'not set — using a development secret. Set one before deploying (openssl rand -base64 32)',
  );

  const paymentsProvider = process.env.PAYMENTS_PROVIDER;
  const paymentsReady =
    (paymentsProvider === 'razorpay' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ||
    (paymentsProvider === 'stripe' && process.env.STRIPE_SECRET_KEY);
  line(
    'Payments',
    paymentsReady ? true : null,
    paymentsReady ? `${paymentsProvider} configured` : 'not configured — plan switching works, no charges are made',
  );

  const domainsReady = Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
  line(
    'Custom domain API',
    domainsReady ? true : null,
    domainsReady ? 'Vercel Domains API connected' : 'not configured — WEBORA returns DNS records for manual setup',
  );

  const emailReady = Boolean(process.env.EMAIL_PROVIDER);
  line(
    'Email delivery',
    emailReady ? true : null,
    emailReady ? 'configured' : 'not configured — password reset links are shown in-app instead of emailed',
  );

  try {
    await stat(path.join(cwd, '.data', 'webora.json'));
    line('Local data file', true, '.data/webora.json exists');
  } catch {
    line('Local data file', null, 'not created yet — it appears after the first signup');
  }

  console.log('─'.repeat(72));
  console.log('Next:  npm run dev      → http://localhost:3000');
  console.log('Docs:  README.md · docs/DEPLOYMENT.md · docs/AI.md\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
