# WEBORA — AI Business Website Studio

**Your business online. Built with AI.**

Describe your business in one sentence. WEBORA creates a professional website you
can customise, publish and grow — pages, copy, imagery, SEO, a visual editor and
a live URL.

```
"I own a bakery in Hyderabad. We sell cakes, pastries and coffee."
                              ↓  WEBORA
Homepage · About · Services · Gallery · Contact
Menu with prices · Reviews · Opening hours · WhatsApp + map + enquiry form
```

This is a working application, not a mockup. Accounts, generation, the editor,
publishing, analytics and the contact-form inbox are implemented end to end, and
`npm run smoke` proves it against a running server.

---

## Quick start

```bash
git clone <your-repo> webora
cd webora
npm install
npm run dev            # → http://localhost:3000
```

No configuration is required. WEBORA starts on the **local storage driver**
(`.data/webora.json`) and the **local generation engine**, so you can sign up,
generate a website, edit it and publish it immediately.

```bash
npm run seed:demo      # optional: demo@webora.app / Webora12345 with a published sample site
```

For a longer-lived local setup, create `.env.local` with an `AUTH_SECRET`
(`openssl rand -base64 32`) so sessions survive restarts — the app warns in the
console when one is missing. `.env.local` is git-ignored and must never be
committed.

Optional integrations, all activated purely through environment variables:

| Feature | Without configuration | With configuration |
| --- | --- | --- |
| Storage | local JSON store | Supabase Postgres (`STORAGE_DRIVER=supabase`) |
| Copywriting | local engine (industry content libraries) | AI provider refines the draft (`AI_PROVIDER`, `AI_API_KEY`) |
| Custom domains | DNS records generated, verified manually | attached via the Vercel Domains API |
| Payments | plan switching, nothing charged | Razorpay / Stripe integration points |
| Password reset | reset link shown in-app | emailed, once a mail provider is wired |

---

## What is implemented

**Accounts** — sign up, sign in, sign out, password reset (request + confirm),
profile editing, plan switching. Sessions are signed httpOnly cookies (jose);
passwords are hashed with bcrypt.

**Generation** — a six-stage pipeline (`src/services/ai`) that reads your
description, detects your industry, recommends a template, composes the copy deck,
resolves design tokens, audits responsiveness, then assembles pages, navigation
and SEO. Every stage reports its measured duration, which is what the progress
screen displays.

**Editor** (`/editor/<id>`) — click any text on the canvas and type. Left rail:
pages, sections, component library, theme, site settings. Right inspector:
schema-driven controls for every section type, spacing, image uploads, SEO and
per-section AI rewrite. Desktop / tablet / mobile previews render inside real
iframes, so media queries resolve against the device width. Autosave, undo/redo
(⌘Z / ⇧⌘Z), ⌘S to save, ⌘P to publish.

**Publishing** — pre-flight checks, then one click to go live at `/s/<slug>`.
Draft changes never reach visitors; owners see a badged draft preview instead.
Connect a custom domain and WEBORA returns the exact DNS records to add.

**Business features** — WhatsApp button and floating chat, click-to-call, Google
Map embed, enquiry form that writes to your dashboard inbox, opening hours with a
live open/closed indicator, galleries, testimonials, services, pricing, booking
CTAs, social links.

**Analytics** — first-party page views recorded by the published site itself:
visitors, page views, top pages, devices and traffic sources. No cookies, no
third-party scripts. Sample sites are clearly labelled **Demo data**.

**Templates & styles** — 9 industry templates and 6 design presets, all
token-driven so a style change re-skins every section at once.

---

## Project structure

```
webora/
├── src/
│   ├── app/
│   │   ├── (marketing)/          landing, how-it-works, templates, pricing, legal
│   │   ├── (auth)/               login, signup, password reset
│   │   ├── (app)/dashboard/      websites, templates, analytics, enquiries, domains, settings
│   │   ├── create/               the 5-step generation wizard
│   │   ├── editor/[id]/          the visual editor
│   │   ├── s/[slug]/             published websites (home + sub-pages)
│   │   ├── domain/[hostname]/    custom-domain entry point
│   │   ├── robots.ts, sitemap.ts SEO surface (drafts are never listed)
│   │   └── api/                  auth, generate, sites, sections, pages, assets, ai, public, billing
│   ├── components/
│   │   ├── ui/                   buttons, fields, modal, toasts, primitives
│   │   ├── marketing/            landing blocks, hero stack, pricing, template gallery
│   │   ├── wizard/               describe → style → generate → result
│   │   ├── editor/               rails, inspector, canvas, preview frames, publish dialog
│   │   ├── dashboard/            shell, website cards, analytics, enquiries, domains, settings
│   │   └── site/                 the website renderer: 15 section components + inline editing
│   ├── services/ai/              generation orchestrator, local engine, provider adapter
│   ├── lib/
│   │   ├── db/                   Store contract + local and Supabase drivers
│   │   ├── auth/                 sessions, passwords, request validation
│   │   ├── industry/packs.ts     the content brain (9 industry libraries)
│   │   ├── sections/schemas.ts   section registry: defaults + editor field schemas
│   │   ├── templates/catalog.ts  template blueprints + recommendations
│   │   ├── media/                stock image catalogue (+ disk-verified server view)
│   │   └── design/styles.ts      style presets and design tokens
│   └── types/                    the shared domain model
├── database/                     SQL schema, seed and migration runner
├── docs/                         architecture, AI, auth, payments, deployment
└── scripts/                      setup doctor, migration runner, smoke test, demo seed
```

---

## Scripts

```bash
npm run dev         # development server on 0.0.0.0:3000
npm run build       # production build
npm run start       # production server
npm run typecheck   # tsc --noEmit
npm run setup       # environment doctor (what is configured, what is not)
npm run smoke       # end-to-end test against a running server (39 checks)
npm run seed:demo   # create a demo account with a published sample website
npm run db:migrate  # apply database/migrations against DATABASE_URL
```

### Verify it works

With a server running (`npm run dev`, or `npm run build && npm run start`):

```bash
npm run smoke
```

The smoke test drives the real HTTP surface with no mocks: it signs up, generates
a website, edits a headline and a design token, publishes it, loads the live page
and checks the edited copy and SEO tags, records a page view and submits the
contact form, reads both back in the dashboard, connects and removes a domain,
duplicates and deletes the copy, rewrites a section, exercises the plan limits on
Free and again on Pro, confirms checkout reports the payment provider as
unconfigured, renders every signed-in page, signs out and cleans up after itself.
Point it at any deployment with `BASE_URL=https://your-app.vercel.app npm run smoke`.

---

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layers, data flow, the section registry, design tokens |
| [`docs/AI.md`](docs/AI.md) | The generation pipeline, local engine vs provider, honest labelling |
| [`docs/AUTH.md`](docs/AUTH.md) | Sessions, password policy, swapping in Supabase Auth |
| [`docs/PAYMENTS.md`](docs/PAYMENTS.md) | Razorpay / Stripe integration points and what is deliberately not wired |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel + Supabase deployment, custom domains, environment reference |
| [`database/README.md`](database/README.md) | Schema, relationships, migrations, RLS |

---

## Design language

Clean typography (Fraunces display + Inter), large whitespace, premium cards,
subtle glass surfaces, soft shadows and **minimal 3D depth** — reserved for
website previews, floating browser windows and template cards. Animation is
restrained (200–400 ms fades, slides and hover depth) and respects
`prefers-reduced-motion`. Warm amber (`#F26A1B`) is the single accent; black,
charcoal and white carry the structure.

---

## Honest by design

This project deliberately avoids pretending. Specifically:

- Generation never claims to be AI-produced when no provider is connected — the
  wizard, dashboard and each website record which engine ran.
- Analytics attached to a sample site is labelled **Demo data**.
- Payment processing is described as architecture, not implemented silently.
- Custom domains are recorded with real DNS instructions; the status only flips
  to *Active* when verification actually succeeds.
- Password reset shows the link in-app when no mail provider exists, rather than
  claiming an email was sent.

---

## License

Released for evaluation and learning. Replace the legal pages with your own
reviewed policies before commercial use.
