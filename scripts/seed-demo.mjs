#!/usr/bin/env node
/**
 * Seed a demo account so the product can be explored immediately.
 *
 *   node scripts/seed-demo.mjs                     # demo@webora.app / Webora12345
 *   node scripts/seed-demo.mjs --email me@x.com --password 'Secret123' --industry salon
 *
 * It talks to the running server over HTTP (default http://127.0.0.1:3000), so it
 * uses exactly the same signup → generate → publish path a real customer would.
 * The sample website it creates is a normal draft-then-published site with
 * clearly-labelled demo analytics, and it can be deleted from the dashboard.
 */

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const BASE = (arg('base', process.env.BASE_URL ?? 'http://127.0.0.1:3000')).replace(/\/$/, '');
const email = arg('email', 'demo@webora.app');
const password = arg('password', 'Webora12345');
const industry = arg('industry', 'bakery');

let cookie = '';

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  for (const value of res.headers.getSetCookie?.() ?? []) {
    const pair = value.split(';')[0];
    if (pair.startsWith('webora_session=')) cookie = pair;
  }
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const signup = await call('/api/auth/signup', {
  method: 'POST',
  body: { name: 'Demo Owner', email, password, company: 'Demo Business' },
});

if (signup.status === 409 || signup.status === 400) {
  // The account already exists — sign in instead, and keep its data.
  const login = await call('/api/auth/login', { method: 'POST', body: { email, password } });
  if (login.status !== 200) {
    console.error(`✗ ${email} exists but the password does not match. Pass --password to update the seed.`);
    process.exit(1);
  }
  console.log(`• ${email} already existed — signed in, leaving its websites untouched.`);
} else if (signup.status !== 201) {
  console.error(`✗ signup failed (HTTP ${signup.status}): ${signup.json?.error ?? 'unknown error'}`);
  process.exit(1);
} else {
  console.log(`✓ account created: ${email} / ${password}`);
}

// A second website needs a paid plan (Free includes one) — switch first so the
// sample site can be created on a workspace that may already have one.
const profile = await call('/api/auth/profile');
const used = profile.json?.data?.usage?.websites ?? 0;
if (used > 0) {
  const upgrade = await call('/api/auth/profile', { method: 'POST', body: { plan: 'pro' } });
  console.log(`• ${used} website(s) already present → plan set to ${upgrade.json?.data?.plan ?? 'pro'} for seeding`);
}

const sample = await call('/api/sites', { method: 'POST', body: { mode: 'sample', industry } });
const site = sample.json?.data?.website;
if (!site) {
  console.error(`✗ sample site creation failed (HTTP ${sample.status}): ${sample.json?.error ?? 'unknown error'}`);
  process.exit(1);
}
console.log(`✓ sample website generated: "${site.name}" (${site.pages.length} pages, ${site.styleId})`);

const published = await call(`/api/sites/${site.id}/publish`, { method: 'POST', body: { action: 'publish' } });
const url = published.json?.data?.url;
console.log(url ? `✓ published → ${BASE}${url}` : `• left as a draft (publishing returned HTTP ${published.status})`);

console.log(`\nSign in at ${BASE}/login with ${email} / ${password}`);
console.log(`Editor:    ${BASE}/editor/${site.id}`);
console.log(`Dashboard: ${BASE}/dashboard\n`);
