# WEBORA deployment guide

WEBORA is a standard Next.js 15 App Router application. It runs anywhere Node 20+
runs, and the recommended production setup is **Vercel + Supabase**.

---

## 1. Requirements

| | |
| --- | --- |
| Node | 20.9 or newer (developed on 20.20) |
| npm | 10+ |
| Optional | Supabase project (Postgres + Storage), domain, AI provider key |

---

## 2. Environment variables

Every variable is optional: without any of them WEBORA runs on the local file
store and the local generation engine. Copy `.env.example` → `.env.local` and fill
in what you actually have.

### Core

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Absolute URLs in metadata, sitemap, reset links |
| `AUTH_SECRET` | dev fallback | Signs session cookies. **Set this in production** (`openssl rand -base64 32`). The app logs a warning when it is missing. |

### Storage

| Variable | Default | Purpose |
| --- | --- | --- |
| `STORAGE_DRIVER` | `local` | `local` (`.data/webora.json`) or `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Supabase project URL (required for `supabase`) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Server-side key for the database and Storage. Never expose to the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Only needed if you add browser-side Supabase calls |
| `SUPABASE_STORAGE_BUCKET` | `webora-assets` | Bucket used for uploaded images |
| `DATABASE_URL` | — | Postgres connection string, used by `npm run db:migrate` |

If `STORAGE_DRIVER=supabase` but credentials are missing, WEBORA keeps working on
the local driver and says so in Dashboard → Settings and in `npm run setup`.

### Generation

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | — | `openai` · `anthropic` · `gemini` · `openai-compatible` |
| `AI_API_KEY` | — | Provider key (server-side only) |
| `AI_MODEL` | provider default | Model id |
| `AI_BASE_URL` | provider default | Required for `openai-compatible` (Groq, OpenRouter, Ollama, vLLM…) |
| `AI_MAX_TOKENS` | `2000` | Response cap |

With no provider configured — or if the provider errors, times out or is rate
limited — generation falls back to the local engine and labels the result
accordingly. See [`AI.md`](AI.md).

### Payments, domains, email

| Variable | Purpose |
| --- | --- |
| `PAYMENTS_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Enables real checkout. See [`PAYMENTS.md`](PAYMENTS.md) |
| `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` | Attach custom domains through the Vercel Domains API. Without them WEBORA records the domain and returns manual DNS instructions |
| `WEBORA_INGRESS_IP`, `WEBORA_INGRESS_TARGET` | Addresses shown in those DNS instructions (defaults are placeholders for a generic host) |
| `EMAIL_PROVIDER` (+ its provider key) | Switches password reset from "show the link in-app" to "send an email". See [`AUTH.md`](AUTH.md) |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Label shown in the analytics panel when you add a third-party provider later |

Check what you have configured at any time:

```bash
npm run setup
```

---

## 3. Supabase setup

1. Create a project. Copy the project URL, the **service role** key and the
   Postgres connection string.
2. Apply the schema — either:

   ```bash
   DATABASE_URL="postgresql://postgres:...@db.<project>.supabase.co:5432/postgres" npm run db:migrate
   ```

   or paste `database/migrations/001_init.sql` and then
   `database/migrations/002_seed_templates.sql` into the Supabase SQL editor. Both
   are idempotent, so either path is safe to repeat. The runner records applied
   files in `public._migrations`.
3. Create a **public** storage bucket named `webora-assets` if you want uploaded
   images stored in Supabase Storage. Without it, uploads fall back to
   `public/uploads/` on the server — which is not writable on Vercel, so create
   the bucket before relying on uploads in production.
4. Set `STORAGE_DRIVER=supabase`, `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` in the hosting environment.

Row-level security is enabled on every table with no permissive policies, so the
anon key cannot read your data — only the server-side service role can.

---

## 4. Deploying to Vercel

```bash
npm i -g vercel
vercel link
vercel env add AUTH_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production     # https://your-app.vercel.app
vercel env add STORAGE_DRIVER production          # supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

Build settings are the defaults (install `npm install`, build `npm run build`).
Every route that touches bcrypt or the filesystem declares `runtime = 'nodejs'`.
The `sitemap.xml` route revalidates hourly and is refreshed immediately whenever a
website is published or unpublished.

### Verifying a deployment

```bash
BASE_URL=https://your-app.vercel.app npm run smoke
```

That runs the whole product against the live URL: account, generation, editor
save, publish, the public page, analytics, the enquiry form, domains, plan limits,
duplication and sign-out. It deletes the website it creates, but it does need to
sign up an account, so point it at a staging deployment rather than a workspace
holding real customer data.

---

## 5. Custom domains

Two supported paths.

**A — Vercel Domains API (automated).** Set `VERCEL_API_TOKEN` and
`VERCEL_PROJECT_ID`. Adding a domain from Dashboard → Domains then calls the
Domains API; WEBORA still reports the DNS records the owner has to add for
verification, and only shows *Active* once that actually succeeds.

**B — Manual DNS.** Without the token, WEBORA records the hostname as `pending`
and returns the records to add:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` (apex) | `WEBORA_INGRESS_IP` — your host's IP |
| `CNAME` | `www` (subdomains) | `WEBORA_INGRESS_TARGET` — your host's target |
| `TXT` | `_webora` | `webora-verify=<hash>` |

### Serving requests by hostname

`src/app/domain/[hostname]/[[...path]]/page.tsx` resolves a hostname to its
published website and renders the DNS checklist when the domain is registered but
not yet verified. To route arbitrary hostnames into it:

- **Vercel with the domain attached** — add a rewrite in `next.config.mjs`, or map
  the domain at the platform level.
- **Your own proxy/CDN** — forward the request path as
  `/domain/<hostname>/<original path>`.

Apex and `www` are separate hostnames; register both if both should resolve.

---

## 6. Post-deploy checklist

1. `AUTH_SECRET` is set in production (the console tells you if it is not).
2. `curl -s https://your-app/api/generate` returns the active engine.
3. Sign up → generate → edit → publish → open the live URL.
4. Submit the enquiry form on the live site → it appears in Dashboard → Enquiries.
5. Dashboard → Settings shows the storage driver and engine you expect.
6. `https://your-app/sitemap.xml` lists only published websites.
7. Delete any test account and website you created while checking.

---

## 7. Operational notes

- **Backups.** On Supabase, use the built-in backups. On the local driver, back up
  `.data/webora.json` — it holds everything.
- **Scaling the local driver.** It serialises writes through a promise chain and
  keeps the database in memory per process, which is ideal for a single instance
  and unsuitable for several. Use `STORAGE_DRIVER=supabase` for anything
  horizontally scaled.
- **Uploads.** Images uploaded through the editor go to Supabase Storage when
  configured, otherwise `public/uploads/` (git-ignored, not writable on Vercel).
