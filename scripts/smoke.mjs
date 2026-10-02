#!/usr/bin/env node
/**
 * WEBORA end-to-end smoke test.
 *
 * Exercises the real HTTP surface of a running server: signup → generation →
 * editing → publishing → the public site → analytics → enquiries → domains →
 * duplication → cleanup. No mocks, no database fixtures — it talks to whatever
 * `BASE_URL` points at (default http://127.0.0.1:3000).
 *
 *   npm run dev            # in one terminal
 *   npm run smoke          # in another
 *
 * Exits non-zero if any check fails, so it works as a pre-deploy gate.
 */

const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const stamp = Date.now().toString(36);

let cookie = '';
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? '\u001b[32m✓\u001b[0m' : '\u001b[31m✗\u001b[0m';
  console.log(`${mark} ${name}${detail ? ` \u001b[90m— ${detail}\u001b[0m` : ''}`);
}

async function call(path, { method = 'GET', body, raw = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const value of setCookies) {
    const pair = value.split(';')[0];
    if (pair.startsWith('webora_session=')) cookie = pair;
  }

  if (raw) return { status: res.status, text: await res.text(), headers: res.headers };
  const json = await res.json().catch(() => null);
  return { status: res.status, json, headers: res.headers };
}

function check(name, condition, detail = '') {
  record(name, Boolean(condition), detail);
  return Boolean(condition);
}

// A fixed test identity keeps repeated runs from littering the workspace with
// throwaway accounts — it signs up once and signs in on every later run.
const email = process.env.SMOKE_EMAIL ?? 'smoke@webora.test';
const password = process.env.SMOKE_PASSWORD ?? 'Webora12345';

console.log(`\nWEBORA smoke test → ${BASE}\n${'─'.repeat(56)}`);

/* ---------------------------------------------------------------- 1. account */
let signup = await call('/api/auth/signup', {
  method: 'POST',
  body: { name: 'Smoke Tester', email, password, company: 'Smoke Bakery' },
});
if (signup.status !== 201) {
  signup = await call('/api/auth/login', { method: 'POST', body: { email, password } });
  check('signs in with the existing test account', signup.status === 200 && cookie, `HTTP ${signup.status}`);
} else {
  check('signup creates an account and a session cookie', signup.status === 201 && cookie, `HTTP ${signup.status}`);
}

// Earlier runs may have left a site behind (a failed run, for example). Clear
// them so the Free-plan limit assertions below stay meaningful.
const existing = await call('/api/sites');
const leftovers = existing.json?.data?.websites ?? [];
for (const site of leftovers) {
  await call(`/api/sites/${site.id}`, { method: 'DELETE' });
}
// This run owns its test account: always start from Free so the plan-limit
// assertions below are deterministic on repeat runs (an earlier run upgrades it
// to Pro and that change persists in the store).
await call('/api/auth/profile', { method: 'POST', body: { plan: 'free' } });

/* ------------------------------------------------------------- 2. generation */
const generated = await call('/api/generate', {
  method: 'POST',
  body: {
    styleId: 'warm-artisan',
    business: {
      name: 'Smoke Bakery',
      type: 'Bakery',
      industry: 'bakery',
      description:
        'We bake sourdough bread, cakes and pastries fresh every morning in Kukatpally, Hyderabad, and deliver within 5 km.',
      city: 'Hyderabad',
      country: 'India',
      services: ['Sourdough bread', 'Custom cakes', 'Coffee'],
      phone: '+91 90000 00000',
      whatsapp: '+91 90000 00000',
      email: 'hello@smokebakery.test',
      address: '12 Main Road, Kukatpally, Hyderabad',
      currency: 'INR',
      tone: 'warm',
      tags: ['bakery', 'cakes'],
    },
  },
});

const site = generated.json?.data?.website;
check(
  'generation returns a full website',
  generated.status === 201 && site?.pages?.length >= 4,
  `HTTP ${generated.status} · ${site?.pages?.length ?? 0} pages · engine ${generated.json?.data?.generationStatus?.engine ?? generated.json?.data?.engine ?? '?'}`,
);
check(
  'generated pages carry sections and SEO',
  Boolean(site?.pages?.every((p) => p.sections.length && p.seo?.title && p.seo?.description)),
  site ? `home has ${site.pages[0].sections.length} sections` : '',
);
check(
  'generation reports a measured stage timeline',
  Array.isArray(generated.json?.data?.stages) && generated.json.data.stages.length >= 5,
  `${generated.json?.data?.stages?.length ?? 0} stages`,
);

if (!site) {
  console.log('\nGeneration failed — stopping here.\n');
  process.exit(1);
}

const siteId = site.id;

/* ----------------------------------------------------------------- 3. editing */
const headline = `Smoke Bakery — fresh from the oven ${stamp}`;
const editedPages = site.pages.map((page, index) =>
  index === 0
    ? {
        ...page,
        sections: page.sections.map((s) => (s.type === 'hero' ? { ...s, props: { ...s.props, heading: headline } } : s)),
      }
    : page,
);

const patched = await call(`/api/sites/${siteId}`, { method: 'PATCH', body: { pages: editedPages } });
check('editor save persists page content', patched.status === 200 && patched.json?.ok === true, `HTTP ${patched.status}`);

const tokenPatch = await call(`/api/sites/${siteId}`, {
  method: 'PATCH',
  body: { tokens: { ...site.tokens, accent: '#0f766e' } },
});
check('design token change is saved', tokenPatch.status === 200, `HTTP ${tokenPatch.status}`);

/* --------------------------------------------------------------- 4. publishing */
const published = await call(`/api/sites/${siteId}/publish`, { method: 'POST', body: { action: 'publish' } });
const livePath = published.json?.data?.url ?? `/s/${site.slug}`;
check(
  'publishing returns a live URL and pre-flight checks',
  published.status === 200 && Boolean(published.json?.data?.url),
  `${livePath} · ${published.json?.data?.checks?.sections ?? 0} sections`,
);

const live = await call(livePath, { raw: true });
check('published site renders on the public route', live.status === 200, `HTTP ${live.status} · ${live.text.length} bytes`);
check('published site contains the edited headline', live.text.includes(headline));
check('published site carries SEO metadata', live.text.includes('<meta name="description"'));

const draftProbe = await call('/s/definitely-not-a-real-site', { raw: true });
check('unknown site slug returns 404', draftProbe.status === 404, `HTTP ${draftProbe.status}`);

const robots = await call('/robots.txt', { raw: true });
const sitemap = await call('/sitemap.xml', { raw: true });
check('robots.txt is served', robots.status === 200 && robots.text.includes('Sitemap:'));
check('sitemap.xml lists the published site', sitemap.status === 200 && sitemap.text.includes(`/s/${published.json?.data?.website?.slug ?? site.slug}`));

/* --------------------------------------------------- 5. public interactions */
const tracked = await call(`/api/public/${site.slug}/track`, {
  method: 'POST',
  body: { path: '/', referrer: 'https://www.google.com/', device: 'mobile' },
});
check('page view is recorded', tracked.status === 200, `HTTP ${tracked.status}`);

const enquiry = await call(`/api/public/${site.slug}/enquiry`, {
  method: 'POST',
  body: { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 90000 11111', message: 'Do you make eggless cakes for 20 people?' },
});
check('contact form submission is accepted', enquiry.status === 201 || enquiry.status === 200, `HTTP ${enquiry.status}`);

const analytics = await call(`/api/sites/${siteId}/analytics?days=30`);
const inbox = await call(`/api/sites/${siteId}/enquiries`);
check(
  'analytics reports the real visit',
  (analytics.json?.data?.summary?.pageViews ?? 0) >= 1 && analytics.json?.data?.summary?.firstParty === true,
  `${analytics.json?.data?.summary?.pageViews ?? 0} page views · firstParty ${analytics.json?.data?.summary?.firstParty}`,
);
check('enquiry inbox receives the submission', (inbox.json?.data?.enquiries?.length ?? 0) >= 1, `${inbox.json?.data?.enquiries?.length ?? 0} enquiries`);

const firstEnquiry = inbox.json?.data?.enquiries?.[0];
if (firstEnquiry) {
  const read = await call(`/api/sites/${siteId}/enquiries`, { method: 'PATCH', body: { enquiryId: firstEnquiry.id, read: true } });
  check('enquiry can be marked read', read.status === 200, `HTTP ${read.status}`);
}

/* -------------------------------------------- 6. plan limits on the Free plan */
const blockedDuplicate = await call(`/api/sites/${siteId}/duplicate`, { method: 'POST' });
check(
  'Free plan blocks a second website with a clear reason',
  blockedDuplicate.status === 402 && typeof blockedDuplicate.json?.error === 'string',
  `HTTP ${blockedDuplicate.status} — ${blockedDuplicate.json?.error ?? ''}`.slice(0, 96),
);

const blockedDomain = await call(`/api/sites/${siteId}/domain`, { method: 'POST', body: { hostname: `blocked-${stamp}.example.com` } });
check('Free plan blocks custom domains (Starter upwards)', blockedDomain.status === 402, `HTTP ${blockedDomain.status}`);

const upgrade = await call('/api/auth/profile', { method: 'POST', body: { plan: 'pro' } });
check(
  'plan can be switched without pretending a payment happened',
  upgrade.status === 200 && upgrade.json?.data?.plan === 'pro' && upgrade.json?.data?.paymentProcessed === false,
  upgrade.json?.data?.note ?? `HTTP ${upgrade.status}`,
);

/* --------------------------------------------- 7. paid features, now unlocked */
const domain = await call(`/api/sites/${siteId}/domain`, { method: 'POST', body: { hostname: `smoke-${stamp}.example.com` } });
check(
  'connecting a domain returns the DNS records to add',
  domain.status === 200 &&
    (domain.json?.data?.instructions?.records?.length ?? 0) > 0 &&
    domain.json?.data?.domain?.status === 'pending',
  `${domain.json?.data?.instructions?.records?.length ?? 0} records · status ${domain.json?.data?.domain?.status} · hosting API ${domain.json?.data?.providerConfigured ? 'configured' : 'not configured (manual DNS)'}`,
);
const domainRemoved = await call(`/api/sites/${siteId}/domain`, { method: 'DELETE' });
check('domain can be disconnected', domainRemoved.status === 200, `HTTP ${domainRemoved.status}`);

const duplicated = await call(`/api/sites/${siteId}/duplicate`, { method: 'POST' });
const copyId = duplicated.json?.data?.website?.id;
check('website can be duplicated on a paid plan', duplicated.status === 201 && copyId && copyId !== siteId, `HTTP ${duplicated.status}`);
if (copyId) {
  const removed = await call(`/api/sites/${copyId}`, { method: 'DELETE' });
  check('duplicate can be deleted', removed.status === 200, `HTTP ${removed.status}`);
}

/* ------------------------------------------------- 8. sections, AI, provider */
const pageId = site.pages[0].id;
const added = await call(`/api/sites/${siteId}/sections`, {
  method: 'POST',
  body: { pageId, type: 'faq', index: 1 },
});
check('a section can be added to a page', added.status === 201, `HTTP ${added.status}`);

const ai = await call('/api/ai/section', {
  method: 'POST',
  body: { siteId, pageId, sectionId: site.pages[0].sections.find((s) => s.type === 'hero')?.id, instruction: 'make the headline shorter and warmer' },
});
const rewrittenHeading = ai.json?.data?.props?.heading ?? '';
check(
  'section rewrite returns new copy and labels its engine',
  ai.status === 200 &&
    Boolean(ai.json?.data?.props) &&
    Boolean(ai.json?.data?.engineLabel) &&
    rewrittenHeading.trim() !== '' &&
    rewrittenHeading !== headline,
  `"${headline}" → "${rewrittenHeading}" · ${ai.json?.data?.engineLabel ?? `HTTP ${ai.status}`}`,
);

const plan = await call('/api/billing/checkout', { method: 'POST', body: { plan: 'pro' } });
check(
  'checkout reports that no payment provider is configured',
  plan.status === 200 && plan.json?.data?.configured === false && (plan.json?.data?.setupRequirements?.length ?? 0) > 0,
  `${plan.json?.data?.setupRequirements?.length ?? 0} setup steps listed`,
);

/* --------------------------------- 9. signed-in pages render server-side */
const signedInPages = [
  '/dashboard',
  '/dashboard/templates',
  '/dashboard/analytics',
  '/dashboard/enquiries',
  '/dashboard/domains',
  '/dashboard/settings',
  '/create',
  `/editor/${siteId}`,
];
for (const path of signedInPages) {
  const page = await call(path, { raw: true });
  check(
    `page ${path} renders for its owner`,
    page.status === 200 && !/Application error|Internal Server Error/.test(page.text),
    `HTTP ${page.status} · ${page.text.length} bytes`,
  );
}
const dashboardHtml = await call('/dashboard', { raw: true });
check('dashboard lists the generated website', dashboardHtml.text.includes('Smoke Bakery'));

/* ----------------------------------------------------------------- 9. signing out */
const logout = await call('/api/auth/logout', { method: 'POST' });
const afterLogout = await call('/api/sites');
check('logout clears the session', logout.status === 200 && afterLogout.status === 401, `sites → HTTP ${afterLogout.status}`);

/* --------------------------------------------------------------- 10. cleanup */
// Re-authenticate (the logout above cleared the session) and remove the test
// website so repeated runs do not litter the workspace with published tasters.
const reauth = await call('/api/auth/login', { method: 'POST', body: { email, password } });
if (reauth.status === 200) {
  const cleanup = await call(`/api/sites/${siteId}`, { method: 'DELETE' });
  check('test website cleaned up after the run', cleanup.status === 200, `HTTP ${cleanup.status}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`${'─'.repeat(56)}`);
console.log(`${results.length - failed.length}/${results.length} checks passed in ${BASE}`);
if (failed.length) {
  console.log('\nFailed:');
  for (const f of failed) console.log(`  • ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
  process.exit(1);
}
console.log('All good.\n');
