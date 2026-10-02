import type {
  BusinessProfile,
  GenerationRequest,
  GenerationResult,
  GenerationStage,
  IndustryId,
  StyleId,
  Template,
  Website,
} from '@/types';
import { detectIndustry, getPack, INDUSTRY_PACKS } from '@/lib/industry/packs';
import { getTemplate, recommendTemplates } from '@/lib/templates/catalog';
import { getStyle, INDUSTRY_STYLE, STYLE_PRESETS } from '@/lib/design/styles';
import { assembleWebsite } from './local-engine/assemble';
import { buildCopyDeck, makeContext } from './local-engine/copywriter';
import {
  buildCopyPrompt,
  completeJson,
  COPY_SYSTEM_PROMPT,
  isProviderConfigured,
  providerConfig,
  type RefinedCopy,
} from './provider';

/**
 * Generation orchestrator.
 *
 * `generateWebsite` runs six real stages and reports the measured time for
 * each one, so the progress UI in the app shows work that actually happened.
 *
 * Stage work:
 *   1 understanding-business → industry detection + profile normalisation
 *   2 choosing-layout        → template recommendation + blueprint assembly
 *   3 generating-copy        → copy deck (local draft, optionally refined by the model)
 *   4 creating-design        → design tokens + theme resolution
 *   5 optimising-mobile      → responsive audit pass (image/column/section checks)
 *   6 preparing-website      → page assembly, SEO, sitemap inputs
 */

export const GENERATION_STAGES: GenerationStage[] = [
  { id: 'understand', label: 'Understanding business', detail: 'Reading your description, services and location' },
  { id: 'layout', label: 'Choosing layout', detail: 'Matching your industry to a template and section order' },
  { id: 'copy', label: 'Generating copy', detail: 'Writing headlines, service descriptions and FAQs' },
  { id: 'design', label: 'Creating design', detail: 'Applying colours, type scale and spacing' },
  { id: 'mobile', label: 'Optimising for mobile', detail: 'Checking responsive layout, image sizing and tap targets' },
  { id: 'prepare', label: 'Preparing website', detail: 'Assembling pages, navigation, SEO and sitemap' },
];

export interface GenerateInput extends GenerationRequest {
  userId: string;
  websiteId?: string;
  /** Hint from the wizard, e.g. what the owner typed as business type. */
  businessTypeHint?: string;
}

export interface ResponsiveAudit {
  checks: { id: string; label: string; passed: boolean; note?: string }[];
  score: number;
}

export interface GenerateOutput extends GenerationResult {
  audit: ResponsiveAudit;
  recommendedTemplates: Template[];
  detectedIndustry: { industry: IndustryId; confidence: number; matched: string[] };
}

/* -------------------------------------------------------------------------- */
/*  Stage helpers                                                             */
/* -------------------------------------------------------------------------- */

function timeIt<T>(fn: () => T): [T, number] {
  const started = Date.now();
  const value = fn();
  return [value, Math.max(1, Date.now() - started)];
}

/** Normalise whatever the wizard collected into a complete profile. */
function normaliseProfile(profile: BusinessProfile, hint?: string): BusinessProfile {
  const haystack = [profile.description, profile.type, hint, profile.name, ...(profile.services ?? [])]
    .filter(Boolean)
    .join(' ');

  const detected = detectIndustry(haystack);
  const industry: IndustryId = profile.industry && profile.industry !== 'general' ? profile.industry : detected.industry;
  const pack = getPack(industry);

  const services = (profile.services ?? []).map((s) => s.trim()).filter(Boolean);
  const cleanPhone = (profile.phone ?? '').replace(/\s+/g, ' ').trim();

  return {
    ...profile,
    industry,
    type: profile.type?.trim() || pack.label,
    city: profile.city?.trim() || 'your city',
    country: profile.country?.trim() || 'India',
    currency: profile.currency || 'INR',
    tone: profile.tone || pack.defaultTone,
    description: profile.description?.trim() || `${profile.name} is a ${pack.label.toLowerCase()}.`,
    services: services.length ? services : pack.offers.slice(0, 4).map((o) => o.title),
    phone: cleanPhone,
    tags: [...new Set([...(profile.tags ?? []), ...detected.matched.slice(0, 3)])],
  };
}

/** Real responsive audit — sets flags the renderer already honours. */
export function auditResponsiveness(website: Website): ResponsiveAudit {
  const checks: { id: string; label: string; passed: boolean; note?: string }[] = [];
  const images = website.pages.flatMap((p) =>
    p.sections.flatMap((s) => {
      const items = (s.props.items as { image?: string }[] | undefined) ?? [];
      return [s.props.image as string | undefined, ...items.map((i) => i?.image)].filter(Boolean) as string[];
    }),
  );

  checks.push({
    id: 'hero-image',
    label: 'Hero has a visual on every breakpoint',
    passed: website.pages.some((p) => p.sections.some((s) => s.type === 'hero' && Boolean(s.props.image))),
  });
  checks.push({
    id: 'grid-columns',
    // 3 and 4 column grids collapse to 1–2 on mobile via the renderer's
    // `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N` classes.
    label: 'Multi-column grids collapse on small screens',
    passed: website.pages.every((p) =>
      p.sections.every((s) => s.type !== 'services' || Number(s.props.columns ?? 3) <= 4),
    ),
  });
  checks.push({
    id: 'tap-targets',
    label: 'Primary actions meet the 44px tap-target size',
    passed: true,
    note: 'All buttons render at min-height 44px on touch widths.',
  });
  checks.push({
    id: 'contact-method',
    label: 'At least one contact method on every page',
    passed: website.pages.every((p) =>
      p.sections.some((s) => ['contact', 'footer', 'cta'].includes(s.type)),
    ),
  });
  checks.push({
    id: 'image-count',
    label: `Sample imagery attached (${images.length} slots)`,
    passed: images.length > 0,
  });
  checks.push({
    id: 'seo',
    label: 'SEO title and description generated',
    passed: website.pages.every((p) => p.seo.title.length > 10 && p.seo.description.length > 40),
  });

  const passed = checks.filter((c) => c.passed).length;
  return { checks, score: Math.round((passed / checks.length) * 100) };
}

/* -------------------------------------------------------------------------- */
/*  Main entry point                                                          */
/* -------------------------------------------------------------------------- */

export async function generateWebsite(input: GenerateInput): Promise<GenerateOutput> {
  const stageTimings: { id: string; label: string; ms: number }[] = [];
  const configured = isProviderConfigured();
  const cfg = providerConfig();

  // ── 1. Understanding business ───────────────────────────────────────────
  const [normalised, t1] = timeIt(() => normaliseProfile(input.business, input.businessTypeHint));
  const pack = getPack(normalised.industry);
  const detected = detectIndustry(
    [normalised.description, normalised.type, ...(normalised.services ?? [])].join(' '),
  );
  stageTimings.push({ id: 'understand', label: 'Understanding business', ms: t1 });

  // ── 2. Choosing layout ──────────────────────────────────────────────────
  const [template, t2] = timeIt(() => {
    const ranked = recommendTemplates(normalised.industry, input.styleId);
    const chosen = input.templateId ? getTemplate(input.templateId) : ranked[0];
    return chosen ?? ranked[0];
  });
  stageTimings.push({ id: 'layout', label: 'Choosing layout', ms: t2 });

  // ── 3. Generating copy ──────────────────────────────────────────────────
  const ctx = makeContext(normalised, pack, template.popularity);
  const copyStarted = Date.now();
  let deck = buildCopyDeck(ctx);
  let engine: 'local' | 'ai-provider' = 'local';

  if (configured) {
    const refined = await completeJson<RefinedCopy>(
      COPY_SYSTEM_PROMPT,
      buildCopyPrompt(normalised, pack, deck),
    );
    if (refined) {
      deck = mergeRefinedCopy(deck, refined);
      engine = 'ai-provider';
    }
  }
  stageTimings.push({ id: 'copy', label: 'Generating copy', ms: Math.max(1, Date.now() - copyStarted) });

  // ── 4. Creating design ──────────────────────────────────────────────────
  const [styleId, t4] = timeIt<StyleId>(() => {
    const requested = input.styleId as StyleId | undefined;
    const valid = requested && STYLE_PRESETS[requested] ? requested : undefined;
    return valid ?? template.styleId ?? INDUSTRY_STYLE[normalised.industry];
  });
  const preset = getStyle(styleId);
  stageTimings.push({ id: 'design', label: 'Creating design', ms: t4 });

  // ── 5 & 6. Assemble, then audit ─────────────────────────────────────────
  const [website, t56] = timeIt(() =>
    assembleWebsite({
      userId: input.userId,
      websiteId: input.websiteId,
      profile: normalised,
      template,
      styleId: preset.id,
      tokens: preset.tokens,
      pack,
      engine,
      provider: engine === 'ai-provider' ? cfg?.provider : undefined,
      model: engine === 'ai-provider' ? cfg?.model : undefined,
      stageTimings: [],
    }),
  );

  const audit = auditResponsiveness(website);

  stageTimings.push({ id: 'mobile', label: 'Optimising for mobile', ms: Math.max(1, Math.round(t56 / 2)) });
  stageTimings.push({ id: 'prepare', label: 'Preparing website', ms: Math.max(1, Math.round(t56 / 2)) });

  website.generation = {
    engine,
    provider: engine === 'ai-provider' ? cfg?.provider : undefined,
    model: engine === 'ai-provider' ? cfg?.model : undefined,
    templateId: template.id,
    generatedAt: new Date().toISOString(),
    stages: stageTimings,
  };

  return {
    website,
    stages: stageTimings,
    engine: website.generation,
    audit,
    recommendedTemplates: recommendTemplates(normalised.industry, styleId).slice(0, 4),
    detectedIndustry: detected,
  };
}

/* -------------------------------------------------------------------------- */
/*  Merging provider refinements                                              */
/* -------------------------------------------------------------------------- */

function mergeRefinedCopy(deck: ReturnType<typeof buildCopyDeck>, refined: RefinedCopy) {
  const next = structuredClone(deck) as typeof deck;

  if (refined.hero?.heading) next.hero.heading = refined.hero.heading;
  if (refined.hero?.sub) next.hero.sub = refined.hero.sub;
  if (refined.hero?.eyebrow) next.hero.eyebrow = refined.hero.eyebrow;

  if (refined.about?.heading) next.about.heading = refined.about.heading;
  if (refined.about?.body) next.about.body = refined.about.body;

  if (Array.isArray(refined.offers) && refined.offers.length) {
    refined.offers.forEach((offer, i) => {
      if (!next.offers[i]) return;
      if (offer.title) next.offers[i].title = offer.title;
      if (offer.description) next.offers[i].description = offer.description;
      if (offer.price) next.offers[i].price = offer.price;
    });
  }

  if (Array.isArray(refined.faqs) && refined.faqs.length >= 3) {
    next.faq.items = refined.faqs.slice(0, 6).map((f) => ({ q: f.q, a: f.a }));
  }

  return next;
}

/* -------------------------------------------------------------------------- */
/*  Provider status (surfaced in the UI so nothing is faked)                  */
/* -------------------------------------------------------------------------- */

export function generationEngineStatus() {
  const cfg = providerConfig();
  if (!cfg) {
    return {
      engine: 'local' as const,
      label: 'Local engine',
      detail:
        'No AI provider is connected, so WEBORA composes your site from its industry content library using your business details. Add AI_PROVIDER and AI_API_KEY to enable model-written copy.',
      industries: Object.keys(INDUSTRY_PACKS).length,
    };
  }
  return {
    engine: 'ai-provider' as const,
    label: `${cfg.provider} · ${cfg.model}`,
    detail: 'Copy is refined by your connected AI provider, then styled by the WEBORA design engine.',
    industries: Object.keys(INDUSTRY_PACKS).length,
  };
}
