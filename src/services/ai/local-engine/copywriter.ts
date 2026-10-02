import type { BusinessProfile, IndustryPack, Offer, SeoMeta, ToneId } from '@/types';
import { titleCase } from '@/lib/utils';

/**
 * Copywriter — turns a business profile into publishable website copy.
 *
 * This is deliberately template-driven rather than "AI magic": the output is
 * deterministic, fast, offline and never hallucinates a fake award or a fake
 * phone number. When an AI provider is configured (see ../provider.ts) the
 * same shapes are refined by the model, and the UI labels the engine honestly.
 */

export interface CopyContext {
  profile: BusinessProfile;
  pack: IndustryPack;
  /** Seed so repeats are stable but varied. */
  seed: number;
}

export function makeContext(profile: BusinessProfile, pack: IndustryPack, seed = 0): CopyContext {
  return { profile, pack, seed };
}

/** Replace tokens like {city} in pack copy with real values. */
export function fill(template: string, ctx: CopyContext): string {
  const { profile, pack } = ctx;
  const area = profile.city || 'your city';
  const since = String(new Date().getFullYear() - 12);
  return template
    .replace(/\{city\}/g, area)
    .replace(/\{area\}/g, area)
    .replace(/\{name\}/g, profile.name || 'we')
    .replace(/\{since\}/g, since)
    .replace(/\{daily\}/g, '600')
    .replace(/\{type\}/g, profile.type || pack.label.toLowerCase());
}

export function toneAdjective(tone: ToneId): string {
  return {
    warm: 'warm',
    bold: 'bold',
    elegant: 'refined',
    friendly: 'friendly',
    professional: 'professional',
  }[tone] ?? 'professional';
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

export function buildHeroHeading(ctx: CopyContext): string {
  const { profile, pack } = ctx;
  const desc = profile.description.toLowerCase();

  // If the owner described something specific, lead with their framing.
  const custom = extractHeadline(desc, profile);
  if (custom) return custom;

  // Packs store headlines as two display lines (a pair), e.g.
  // ['Freshly baked happiness,', 'every single morning.'] — joined here so the
  // generated headline always reads as one complete sentence.
  return fill(pack.heroLines.join(' ').replace(/\s+/g, ' ').trim(), ctx);
}

/**
 * Alternate headlines for the same business, used by the section rewrite
 * endpoint. Each one is on-brand and factually identical — only the framing
 * changes — so "rewrite" always produces something genuinely different without
 * inventing anything.
 */
export function heroHeadlineVariants(ctx: CopyContext): string[] {
  const { profile, pack } = ctx;
  const joined = fill(pack.heroLines.join(' ').replace(/\s+/g, ' ').trim(), ctx);
  const firstLine = fill(pack.heroLines[0] ?? '', ctx).replace(/[,;:.!]+$/, '');
  const city = profile.city;
  const variants = [
    joined,
    city ? `${firstLine} in ${city}.` : null,
    fill(pack.promise, ctx),
    `${profile.name} — ${fill(pack.heroEyebrow, ctx).toLowerCase()}`,
    fill(pack.heroSub, ctx).split(/—|\./)[0]?.trim(),
  ].filter((value): value is string => Boolean(value && value.length > 8));
  return Array.from(new Set(variants));
}

function extractHeadline(desc: string, profile: BusinessProfile): string | null {
  // Pull a short, quotable phrase out of the description when it is punchy enough.
  const sentences = desc.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
  const candidate = sentences.find((s) => s.length > 18 && s.length < 68);
  if (!candidate) return null;
  const cleaned = candidate.replace(/^(we|i)\s+(are|own|run|am)\s+/i, '').trim();
  if (cleaned.length < 12) return null;
  return cleaned
    .split(' ')
    .slice(0, 9)
    .join(' ')
    .replace(/[,;:]$/, '') + (candidate.split(' ').length > 9 ? '…' : '');
}

export function buildHeroSub(ctx: CopyContext): string {
  const { profile, pack } = ctx;
  const city = profile.city || 'your city';
  const services = (profile.services ?? []).filter(Boolean);
  if (services.length >= 2) {
    const list = services.slice(0, 3).join(', ').replace(/, ([^,]*)$/, ' and $1');
    return `${list} — for customers across ${city}. ${fill(pack.promise, ctx)}`;
  }
  return fill(pack.heroSub, ctx);
}

export function buildTrustLine(ctx: CopyContext): string {
  const { profile, pack } = ctx;
  const rating = pack.stats.find((s) => s.label.toLowerCase().includes('rating'));
  const phone = profile.phone ? `Call ${profile.phone}` : null;
  const parts = [rating ? `${rating.value}★ ${rating.label.toLowerCase()}` : null, phone].filter(Boolean);
  return parts.join(' · ');
}

/* -------------------------------------------------------------------------- */
/*  About                                                                     */
/* -------------------------------------------------------------------------- */

export function buildAbout(ctx: CopyContext) {
  const { profile, pack } = ctx;
  const services = (profile.services ?? []).filter(Boolean);
  const body = fill(pack.aboutBody, ctx);
  const extra = services.length
    ? ` We specialise in ${services.slice(0, 4).join(', ')}.`
    : '';
  return {
    eyebrow: 'About us',
    heading: fill(pack.aboutHeading, ctx),
    body: body + extra,
    items: pack.aboutBullets.map((text) => ({ text: fill(text, ctx) })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Services / offers                                                         */
/* -------------------------------------------------------------------------- */

const GENERIC_SERVICE_TEMPLATES: Record<string, string> = {
  bakery: 'Made fresh in small batches — ask us about same-day availability.',
  restaurant: 'Prepared to order by our kitchen team using house-ground spice blends.',
  salon: 'Delivered by senior professionals using professional-grade products.',
  gym: 'Coach-led, with progress tracked so you can see the difference.',
  consultant: 'A scoped engagement with written deliverables and clear timelines.',
  portfolio: 'Full process from brief to handover, with senior attention throughout.',
  realestate: 'Verified listings and paperwork handled end to end.',
  photography: 'Relaxed direction, consistent editing and files delivered on schedule.',
  retail: 'Hand-picked, fairly priced and available in store today.',
  general: 'Delivered by our own trained team, with pricing agreed before we start.',
};

export function buildOffers(ctx: CopyContext): Offer[] {
  const { profile, pack } = ctx;
  const userServices = (profile.services ?? []).map((s) => s.trim()).filter(Boolean);

  if (userServices.length >= 2) {
    const offers: Offer[] = userServices.slice(0, 6).map((service, i) => {
      const match = findCloseMatch(service, pack.offers.map((o) => o.title));
      const packOffer = match ? pack.offers.find((o) => o.title === match) : undefined;
      const fallback = pack.offers[i % pack.offers.length];
      const label = titleCase(service);
      return {
        icon: packOffer?.icon ?? fallback?.icon ?? 'star',
        title: label,
        description:
          packOffer?.description ??
          `${label}: ${GENERIC_SERVICE_TEMPLATES[pack.id] ?? GENERIC_SERVICE_TEMPLATES.general}`,
        price: packOffer?.price ?? '',
      };
    });
    // Top up to at least 4 cards so the grid never looks thin.
    const rest = pack.offers.filter((o) => !offers.some((x) => x.title === o.title));
    while (offers.length < 4 && rest.length) {
      const next = rest.shift()!;
      offers.push({ ...next });
    }
    return offers;
  }

  return pack.offers.map((o) => ({ ...o }));
}

function findCloseMatch(needle: string, haystack: string[]): string | undefined {
  const n = needle.toLowerCase();
  return haystack.find((h) => {
    const hl = h.toLowerCase();
    return hl === n || hl.includes(n) || n.includes(hl.split(' ')[0]);
  });
}

/* -------------------------------------------------------------------------- */
/*  Menu / pricing / proof                                                    */
/* -------------------------------------------------------------------------- */

export function buildMenu(ctx: CopyContext) {
  const menu = ctx.pack.menu;
  if (!menu) return null;
  return {
    eyebrow: 'Menu',
    heading: menu.heading,
    sub: fill(ctx.pack.offersSub, ctx),
    note: ctx.profile.currency === 'INR' ? 'Prices inclusive of taxes. Menu changes with the season.' : 'Menu changes with the season.',
    items: menu.categories.map((c) => ({
      name: c.name,
      items: c.items.map((i) => ({ ...i })),
    })),
  };
}

export function buildPricing(ctx: CopyContext) {
  const { pack, profile } = ctx;
  const services = pack.offers.slice(0, 3);
  return {
    eyebrow: 'Packages',
    heading: 'Packages & pricing',
    sub: `Transparent starting prices — we always confirm the final quote before we begin.`,
    note: profile.phone ? `Questions about pricing? Call ${profile.phone}.` : '',
    items: services.map((s, i) => ({
      name: s.title,
      price: s.price ?? 'On request',
      period: s.price?.includes('/') ? '' : 'starting',
      description: s.description,
      features: [
        'Free consultation',
        i === 1 ? 'Priority scheduling' : 'Written quote before work starts',
        i === 2 ? 'Dedicated point of contact' : 'Post-service support',
      ].join('\n'),
      ctaLabel: pack.primaryCta,
      ctaHref: '/contact',
      highlight: i === 1,
    })),
  };
}

export function buildTestimonials(ctx: CopyContext) {
  return {
    eyebrow: 'Reviews',
    heading: 'What customers say',
    sub: 'Real feedback from people we have worked with.',
    layout: 'cards',
    items: ctx.pack.testimonials.map((t) => ({ ...t })),
  };
}

export function buildFaq(ctx: CopyContext) {
  return {
    eyebrow: 'FAQ',
    heading: 'Questions we get asked',
    sub: 'Still unsure? Send us a message and we will answer properly.',
    items: ctx.pack.faqs.map((f) => ({ q: fill(f.q, ctx), a: fill(f.a, ctx) })),
  };
}

export function buildHours(ctx: CopyContext) {
  const hours = ctx.profile.hours?.length ? ctx.profile.hours : ctx.pack.hours;
  return {
    eyebrow: 'Opening hours',
    heading: 'When we are open',
    note: ctx.profile.address ? `Find us at ${ctx.profile.address}.` : '',
    showNow: true,
    items: hours.map((h) => ({ ...h })),
    image: '',
  };
}

export function buildStats(ctx: CopyContext) {
  const { pack, profile } = ctx;
  const items = pack.stats.map((s) => ({
    value: s.value,
    label: fill(s.label, ctx),
  }));
  if (profile.city) {
    items.push({ value: profile.city, label: 'Based in & serving' });
  }
  return { items: items.slice(0, 4), variant: 'band' };
}

/* -------------------------------------------------------------------------- */
/*  SEO                                                                       */
/* -------------------------------------------------------------------------- */

export function buildSeo(ctx: CopyContext, pageTitle: string, path: string, overrideBody?: string): SeoMeta {
  const { profile, pack } = ctx;
  const city = profile.city || 'your city';
  const services = (profile.services ?? []).slice(0, 3);
  const isHome = pageTitle === 'Home';

  const title = isHome
    ? `${profile.name} — ${titleCase(profile.type || pack.label)} in ${city}`
    : `${pageTitle} · ${profile.name}`;

  const description = isHome
    ? `${profile.name} is a ${(profile.type || pack.label).toLowerCase()} in ${city}${
        services.length ? ` offering ${services.join(', ')}` : ''
      }. ${fill(pack.promise, ctx)} Call or message us today.`
    : `${pageTitle} for ${profile.name} in ${city}. ${overrideBody ?? fill(pack.promise, ctx)}`;

  return {
    title: title.slice(0, 60),
    description: description.slice(0, 158),
    keywords: [
      profile.type?.toLowerCase() || pack.label.toLowerCase(),
      ...pack.seoTerms.slice(0, 3),
      city.toLowerCase(),
      `${profile.type?.toLowerCase() || pack.label.toLowerCase()} in ${city.toLowerCase()}`,
      profile.name.toLowerCase(),
    ].filter(Boolean),
    ogImage: '',
    slug: path,
  };
}

/* -------------------------------------------------------------------------- */
/*  Section-level refinement entry point                                      */
/* -------------------------------------------------------------------------- */

/** Assemble the whole copy deck at once — used by the assembler. */
export function buildCopyDeck(ctx: CopyContext) {
  return {
    hero: {
      eyebrow: fill(ctx.pack.heroEyebrow, ctx),
      heading: buildHeroHeading(ctx),
      sub: buildHeroSub(ctx),
      trustLine: buildTrustLine(ctx),
    },
    about: buildAbout(ctx),
    offers: buildOffers(ctx),
    menu: buildMenu(ctx),
    pricing: buildPricing(ctx),
    testimonials: buildTestimonials(ctx),
    faq: buildFaq(ctx),
    hours: buildHours(ctx),
    stats: buildStats(ctx),
  };
}

export type CopyDeck = ReturnType<typeof buildCopyDeck>;
