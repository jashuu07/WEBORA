# Generation & the AI layer

## The pipeline

`generateWebsite()` in `src/services/ai/index.ts` runs six stages and records the
measured duration of each one. The wizard's progress screen displays exactly
these stages, in this order:

| # | Stage | What actually happens |
| --- | --- | --- |
| 1 | Understanding business | Free-text description → industry detection (keyword scoring over 9 packs), profile normalisation (type, city, currency, tone, services) |
| 2 | Choosing layout | Template recommendation: industry match → style affinity → popularity. The chosen template's blueprint becomes the page section order |
| 3 | Generating copy | Copy deck composed from the industry pack and the owner's facts (headline, supporting line, about, offers, menu, pricing, reviews, FAQs, hours, stats) — optionally refined by an AI provider |
| 4 | Creating design | Design tokens resolved from the style preset (or the owner's overrides) |
| 5 | Optimising for mobile | Real audit: hero imagery present, grids collapse, tap-target sizing, contact method reachable on every page, SEO fields populated → a responsive score |
| 6 | Preparing website | Pages, sections, navigation, footer, SEO and sitemap inputs assembled into the `Website` document |

## Two engines, labelled honestly

### Local engine (default)

Deterministic and offline. It composes copy from the industry libraries and the
owner's details: your services become your service cards, your city appears in
your headings, your phone number flows into the nav, contact section and footer.
It never invents awards, statistics or testimonials — review text is clearly
sample content the owner replaces.

### AI provider (optional)

Set `AI_PROVIDER`, `AI_API_KEY` and optionally `AI_MODEL`. Stage 3 then sends the
local draft plus the business facts to the model, asking it to improve the copy
without inventing anything, and merges the result.

```
services/ai/provider.ts
├── providerConfig()        env parsing, per-provider defaults
├── completeJson<T>()       openai · anthropic · gemini · openai-compatible
└── prompts                 strict system prompt + JSON-only contract
```

Supported with no extra dependencies: **OpenAI**, **Anthropic**, **Gemini**, and
any **OpenAI-compatible** endpoint (Groq, Together, OpenRouter, vLLM, Ollama).

Failure handling is deliberate: a timeout, rate limit, malformed response or
missing key keeps the local draft and labels the engine `local`. A website is
never generated in a broken state and never claims AI authorship it did not get.

## Transparency in the UI

| Where | What it says |
| --- | --- |
| Wizard step 3 | Engine name and detail before the result appears |
| Wizard result | Stage-by-stage timings measured on the server |
| Dashboard card | "Generation engine" panel: local engine, or `provider · model` |
| Editor → Site | Full provenance: engine, provider, model, template, timestamp, per-stage ms |
| `/how-it-works` | Explains both engines and why the label matters |

## Section-level rewriting

`POST /api/ai/section` rewrites one section. With a provider configured the
instruction ("make it warmer", "shorten the headline") goes to the model along
with the current props. Without one, WEBORA's local variation engine rotates the
industry library to produce a genuinely different draft — hero headlines rotate
through on-brand alternates (`heroHeadlineVariants`: the industry pair, a
city-led line, the business promise, a name-led line), so a rewrite always lands
on different words rather than pretending to redraft the same sentence. The toast
reports which engine responded; the UI never implies a model ran when it did not.

### Headline pairs

Packs store headlines as two display lines, e.g.
`['Freshly baked happiness,', 'every single morning.']`. The generator joins them
into one complete headline (`buildHeroHeading`), because a half-sentence in a hero
reads like unfinished content — and because the rewrite endpoint compares whole
headlines when choosing the next variant.

## API keys

Keys are read only in `src/services/ai/provider.ts`, which is imported solely by
server route handlers. There is no client import path, and `.env*` is
git-ignored. If `AI_PROVIDER` is set without a key, WEBORA behaves as if no
provider exists instead of failing a request.

## Adding a provider or an industry

- **New provider** — add a branch to `completeJson` in `provider.ts` and a
  default model in `defaults`. Nothing else changes.
- **New industry** — add one pack to `src/lib/industry/packs.ts` with content,
  offers, menu (optional), FAQs, reviews, stats, hours, SEO terms and CTAs. The
  detector, the template recommender and the copy deck pick it up automatically.
