# WEBORA architecture

## Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ Presentation                                                         │
│  (marketing) (auth) (app)/dashboard create editor/[id] s/[slug]      │
│  components: ui · marketing · wizard · editor · dashboard · site     │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ fetch() to route handlers (no server actions)
┌───────────────────────────▼──────────────────────────────────────────┐
│ API — src/app/api/**                                                 │
│  auth · generate · sites/[id]/{pages,sections,publish,domain,        │
│  analytics,enquiries} · assets · ai/section · public/[slug]/*        │
│  every route: zod validation → auth guard → Store → JSON envelope    │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│ Domain services                                                      │
│  services/ai   generation orchestrator, local engine, provider       │
│  lib/sites     ownership, slug uniqueness, plan limits, DNS records  │
│  lib/auth      sessions (jose), passwords (bcrypt), schemas          │
│  lib/media     stock imagery catalogue + disk-verified server view   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ Store interface (lib/db/types.ts)
┌───────────────────────────▼──────────────────────────────────────────┐
│ Storage — lib/db                                                     │
│  local.ts  → .data/webora.json     supabase.ts → PostgreSQL          │
└──────────────────────────────────────────────────────────────────────┘
```

**Why route handlers instead of server actions?** Every mutation is an explicit,
testable HTTP endpoint with a zod schema. That keeps the editor's autosave, the
wizard and the dashboard identical in behaviour, and makes the API usable by
anything else later (`curl`, a mobile app, an integration). It is also what makes
`npm run smoke` possible — the whole product is drivable over HTTP.

**Why one `Store` interface?** The application never knows which database it is
talking to. Switching drivers is an environment variable, and the UI reports which
driver is active rather than hiding it.

## The two content systems

### 1. Industry packs — `src/lib/industry/packs.ts`

Nine libraries (bakery, restaurant, salon, gym, consultant, portfolio, real
estate, photography, retail) plus `general`. Each pack carries real trade content:
offers with prices, menu categories, FAQs, review templates, proof statistics,
gallery captions, SEO terms, tone and CTAs. Adding a trade means adding one
object — no component changes.

### 2. Section registry — `src/lib/sections/schemas.ts`

Each of the 15 section types declares:

- `defaults` — the props it renders with
- `fields` — the editor field schema (`text`, `textarea`, `image`, `color`,
  `number`, `select`, `toggle`, `list`, `link`)
- presentation metadata (`label`, `icon`, `libraryGroup`, `description`)

The editor's inspector is generated from `fields`, so a new control appears in the
UI the moment it is added to the schema. Nested lists (menu categories → items,
footer columns → links) are supported by nesting `itemFields`.

## Rendering a customer website

```
SiteRenderer (client)
 ├── SectionProvider → website, page, editable flag, resolveHref, onText
 ├── tokensToCssVars(website.tokens) → CSS custom properties on .site-root
 └── one component per section type in components/site/sections/*
```

- **Tokens, not hard-coded styles.** Sections reference `var(--w-accent)`,
  `var(--w-radius)`, `var(--w-rhythm)` etc. Changing a style preset or a single
  colour re-skins every section consistently.
- **One renderer, two modes.** `editable` toggles hover outlines, click-to-select
  and inline `contentEditable` text. The published site uses the same components
  with interactivity enabled — the editor cannot drift from what ships.
- **Speed.** Published pages are rendered on the server, so the HTML arrives
  complete and indexable; only the enquiry form tracker and the WhatsApp button
  need JavaScript.

## Public rendering and ownership

`components/site/PublishedSite.tsx` owns one rule: **a visitor may only see a
published website; the owner may always see their own, flagged as a draft
preview.** A draft opened by anyone else returns `404` (not a teaser of
unfinished work), and analytics are only recorded for published sites.

## Editor preview frames

Device previews render the site inside an **iframe** with React's `createPortal`.
That matters: media queries resolve against the iframe viewport, so "Mobile" is
genuinely the 390 px layout rather than a squeezed desktop one. Stylesheets and
font variables are mirrored into the frame on mount.

## The 3D studio layer

The depth in the hero, the `/create` workspace and the editor comes from **CSS 3D
transforms only** — `perspective` on a scene root, `preserve-3d` down the chain,
layered shadows and a light floor. No WebGL or three.js is loaded anywhere; the
effect needs none and the page stays fast.

Composition and motion are deliberately separate:

- **`.studio-layer`** places a window in the scene (absolute position, `translateZ`,
  a 2–4° `rotateY` on the windows behind the main one).
- **`.studio-follow`** answers the pointer and the scroll:
  `translate3d(calc(var(--tx) * var(--m)), …) rotateY(var(--ry) * var(--m))`, where
  `--m` is a per-layer depth multiplier and `--par` is the scroll drift.

`src/components/studio/studio-motion.ts` is the single source of the motion budget:
`useStageMotion` writes `--tx/--ty/--rx/--ry/--par` on the scene root from one rAF
loop (pointer tilt ≤ 3°, shift ≤ 9 px, scroll drift ≤ 26 px), `useInView` starts and
stops that loop, `useElementWidth` sizes the previews, and `prefersReducedMotion`
swaps every transform for a static fade. `useStagePacer` keeps the generation
choreography honest: it paces the six stages over the real duration of the request.

Components: `HeroStudio` (marketing hero), `CreateStudio` (the `/create`
workspace — `BusinessPanel` · `StudioPreview` · `StudioControls`), `BrowserWindow`
(renders a real site document inside a 3D chrome), `GenerationFlow` +
`AssembleOverlay` (the generate sequence), `DeviceSwitch`, and the section
elevation in `SiteRenderer` (`.section-frame` + contextual toolbar).

## State and saving

The editor holds the website document in React state with a snapshot history for
undo/redo. Any change marks the document dirty and triggers a debounced
`PATCH /api/sites/:id` (1.2 s) that sends the whole `pages` array plus any
metadata that changed. `⌘S` forces a save; `⌘P` opens publish.

Structural operations (add page, delete page) go through dedicated endpoints
because they carry server-side rules: plan page limits, slug uniqueness and
protection of the home page.

## SEO surface

Every page carries generated `title`, `description`, `keywords` and Open Graph
fields. `generateMetadata` in the published routes emits real `<meta>`/OG tags,
`robots` rules and a canonical URL. `app/robots.ts` keeps the signed-in areas out
of search results, and `app/sitemap.ts` lists the marketing pages plus every
published website and sub-page — refreshed whenever a site is published or
unpublished. Drafts are never listed.
