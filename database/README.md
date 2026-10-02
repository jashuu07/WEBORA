# WEBORA database

Two storage drivers are supported and both are implemented against the same
`Store` contract (`src/lib/db/types.ts`), so application code never changes:

| Driver | When to use | Where the data lives |
| --- | --- | --- |
| `local` (default) | development, demos, evaluation | `.data/webora.json` (git-ignored) |
| `supabase` | production | PostgreSQL in your Supabase project |

Set `STORAGE_DRIVER=supabase` plus `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` to switch. If the driver is requested without
credentials, WEBORA falls back to `local` and says so in the UI (Dashboard →
Settings) instead of failing silently.

## Structure

```
database/
├── migrations/
│   ├── 001_init.sql           # tables, indexes, triggers, RLS
│   └── 002_seed_templates.sql # template catalogue (mirrors the code catalogue)
└── README.md
```

### Tables and relationships

```
users ─┬─< websites ─┬─< pages ──< sections
       │             ├─< domains            (1 per website)
       │             ├─< analytics_events
       │             └─< enquiries
       └─< assets

templates (catalogue, joined by websites.template_id)
```

- `websites.tokens` — design tokens (colours, fonts, radius, rhythm) applied by the renderer.
- `websites.business` — the business profile captured in the wizard.
- `websites.settings` — website settings (branding, WhatsApp float, form + map toggles).
- `websites.generation` — provenance: which engine (local or provider), template, model and per-stage timings.
- `pages.seo` — per-page meta title, description, keywords and Open Graph fields.
- `sections.props` / `sections.spacing` — the section content and layout controls the editor writes.

### Applying migrations

```bash
# 1. Put your Postgres connection string in .env.local
echo 'DATABASE_URL=postgresql://postgres:...@db.<project>.supabase.co:5432/postgres' >> .env.local

# 2. Apply
npm run db:migrate
```

`scripts/db-migrate.mjs` runs every `*.sql` file in `database/migrations` in
filename order inside a transaction and records applied files in
`public._migrations`, so it is safe to run repeatedly.

Prefer the Supabase SQL editor? Paste `001_init.sql` then `002_seed_templates.sql`
— both are idempotent.

### Notes

- Row level security is enabled on every table. The server uses the service-role
  key (never exposed to the browser), which bypasses RLS by design. No permissive
  policies are created, so an anon key cannot read customer data.
- `analytics_events` stores only path, device class, referrer host and country —
  no cookies, no visitor identifiers.
- Enquiries are deleted with their website (`on delete cascade`).
