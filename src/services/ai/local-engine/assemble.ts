import type {
  BusinessProfile,
  DesignTokens,
  GenerationMeta,
  IndustryPack,
  Page,
  Section,
  SectionType,
  Spacing,
  StyleId,
  Template,
  Website,
  WebsiteSettings,
} from '@/types';
import { INDUSTRY_LABELS, PAGE_SECTIONS, PAGE_TITLES } from '@/lib/templates/catalog';
import { DEFAULT_SPACING, SECTION_DEFS } from '@/lib/sections/schemas';
import { getStyle } from '@/lib/design/styles';
import { buildCopyDeck, fill, makeContext, buildSeo, type CopyContext } from './copywriter';
import { slugify } from '@/lib/utils';
import { existingIndustryImages } from '@/lib/media/stock-server';

/* -------------------------------------------------------------------------- */
/*  Imagery                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Imagery for a generated website.
 *
 * The catalogue lives in `lib/media/stock.ts`; the server-side filter drops any
 * file that is not actually on disk, so a generated site never ships a broken
 * image reference (and picks new stock up automatically once it exists).
 */
export function industryImages(industry: string): string[] {
  return existingIndustryImages(industry);
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                           */
/* -------------------------------------------------------------------------- */

let counter = 0;
export function sid(prefix = 's') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_SPACING_BY_TYPE: Partial<Record<SectionType, Partial<Spacing>>> = {
  nav: { paddingY: 'sm' },
  hero: { paddingY: 'lg' },
  stats: { paddingY: 'sm' },
  cta: { paddingY: 'md' },
  footer: { paddingY: 'md' },
};

export function section(type: SectionType, props: Record<string, unknown>, overrides?: Partial<Section>): Section {
  const def = SECTION_DEFS[type];
  return {
    id: sid(type),
    type,
    variant: (props.variant as string) ?? undefined,
    visible: true,
    label: def?.label ?? type,
    spacing: { ...DEFAULT_SPACING, ...(DEFAULT_SPACING_BY_TYPE[type] ?? {}) },
    props: { ...(def?.defaults ?? {}), ...props },
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/*  Section props builders                                                    */
/* -------------------------------------------------------------------------- */

function navProps(ctx: CopyContext, pages: { title: string; slug: string }[]) {
  const { profile, pack } = ctx;
  return {
    brand: profile.name,
    logoUrl: profile.logoUrl ?? '',
    items: pages.map((p) => ({ label: p.title, href: p.slug === 'home' ? '/' : `/${p.slug}` })),
    ctaLabel: pack.primaryCta,
    ctaHref: '/contact',
    sticky: true,
    showPhone: Boolean(profile.phone),
    phone: profile.phone ?? '',
  };
}

function footerProps(ctx: CopyContext, pages: { title: string; slug: string }[]) {
  const { profile, pack } = ctx;
  const social = profile.social ?? {};
  return {
    brand: profile.name,
    tagline: fill(pack.promise, ctx),
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    address: profile.address ?? profile.city ?? '',
    items: [
      {
        title: 'Explore',
        links: pages.map((p) => ({ label: p.title, href: p.slug === 'home' ? '/' : `/${p.slug}` })),
      },
      {
        title: 'Services',
        links: pack.offers.slice(0, 4).map((o, i) => ({ label: o.title, href: `/services#offer-${i}` })),
      },
    ],
    instagram: social.instagram ?? '',
    facebook: social.facebook ?? '',
    whatsappUrl: profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}` : '',
    copyright: `© ${new Date().getFullYear()} ${profile.name}. All rights reserved.`,
  };
}

function contactProps(ctx: CopyContext) {
  const { profile, pack } = ctx;
  return {
    eyebrow: 'Contact',
    heading: `Let's talk about your ${(profile.type || pack.label).toLowerCase()} needs`,
    sub: profile.city ? `We serve ${profile.city} and nearby areas.` : '',
    phone: profile.phone ?? '',
    whatsapp: profile.whatsapp ?? profile.phone ?? '',
    email: profile.email ?? '',
    address: profile.address ?? profile.city ?? '',
    showForm: true,
    formTitle: 'Send an enquiry',
    mapEmbed: true,
    mapQuery: [profile.name, profile.address, profile.city].filter(Boolean).join(', '),
    responseNote: pack.defaultTone === 'professional' ? 'We reply within one working day.' : 'We usually reply within a few hours.',
  };
}

function ctaProps(ctx: CopyContext, variant: 'solid' | 'soft' | 'dark' = 'solid') {
  const { pack } = ctx;
  return {
    heading: 'Ready when you are',
    sub: fill(pack.promise, ctx),
    primaryLabel: pack.primaryCta,
    primaryHref: '/contact',
    secondaryLabel: pack.secondaryCta,
    secondaryHref: '/services',
    variant,
  };
}

function galleryItems(ctx: CopyContext, count = 6) {
  const images = industryImages(ctx.profile.industry);
  const captions = ctx.pack.galleryCaptions;
  return Array.from({ length: count }).map((_, i) => ({
    image: images[i % images.length],
    caption: captions[i % captions.length] ?? `Photo ${i + 1}`,
  }));
}

function servicesProps(ctx: CopyContext, deck: ReturnType<typeof buildCopyDeck>, variant?: string) {
  return {
    eyebrow: 'What we do',
    heading: ctx.pack.offersHeading,
    sub: fill(ctx.pack.offersSub, ctx),
    columns: '3',
    showIcons: true,
    showPrices: true,
    items: deck.offers,
    variant,
  };
}

/** Build props for one section type, given the generated copy deck. */
function propsFor(
  type: SectionType,
  ctx: CopyContext,
  deck: ReturnType<typeof buildCopyDeck>,
  pages: { title: string; slug: string }[],
): Record<string, unknown> {
  const images = industryImages(ctx.profile.industry);
  switch (type) {
    case 'nav':
      return navProps(ctx, pages);
    case 'footer':
      return footerProps(ctx, pages);
    case 'hero':
      return {
        eyebrow: deck.hero.eyebrow,
        heading: deck.hero.heading,
        sub: deck.hero.sub,
        primaryLabel: ctx.pack.primaryCta,
        primaryHref: '/contact',
        secondaryLabel: ctx.pack.secondaryCta,
        secondaryHref: '/services',
        image: images[0],
        layout: ctx.pack.defaultTone === 'bold' ? 'overlay' : 'split',
        trustLine: deck.hero.trustLine,
      };
    case 'about':
      return {
        ...deck.about,
        image: images[1] ?? images[0],
        layout: 'image-left',
      };
    case 'services':
      return servicesProps(ctx, deck);
    case 'menu':
      return deck.menu ?? SECTION_DEFS.menu.defaults;
    case 'gallery':
      return {
        eyebrow: 'Gallery',
        heading: 'A look around',
        sub: 'Sample images from our library — replace them with your own photos in the editor.',
        layout: ctx.profile.industry === 'photography' || ctx.profile.industry === 'portfolio' ? 'mosaic' : 'grid',
        items: galleryItems(ctx, ctx.profile.industry === 'photography' ? 8 : 6),
      };
    case 'pricing':
      return deck.pricing;
    case 'testimonials':
      return deck.testimonials;
    case 'hours':
      return deck.hours;
    case 'team':
      return {
        eyebrow: 'Our team',
        heading: 'The people you will meet',
        sub: '',
        items: [
          { name: 'Add your team', role: ctx.pack.label, bio: 'Introduce the people behind the business — customers trust faces.', image: '' },
        ],
      };
    case 'stats':
      return deck.stats;
    case 'faq':
      return deck.faq;
    case 'cta':
      return ctaProps(ctx, ctx.pack.defaultTone === 'bold' ? 'dark' : ctx.pack.defaultTone === 'elegant' ? 'soft' : 'solid');
    case 'contact':
      return contactProps(ctx);
    default:
      return { ...((SECTION_DEFS as Record<string, { defaults?: Record<string, unknown> }>)[type]?.defaults ?? {}) };
  }
}

/* -------------------------------------------------------------------------- */
/*  Website assembly                                                          */
/* -------------------------------------------------------------------------- */

export interface AssembleInput {
  userId: string;
  profile: BusinessProfile;
  template: Template;
  styleId: StyleId;
  tokens: DesignTokens;
  pack: IndustryPack;
  websiteId?: string;
  engine: GenerationMeta['engine'];
  provider?: string;
  model?: string;
  stageTimings: { id: string; label: string; ms: number }[];
}

export function assembleWebsite(input: AssembleInput): Website {
  const { profile, template, tokens, pack } = input;
  const websiteId = input.websiteId ?? sid('site');
  const ctx = makeContext(profile, pack, template.popularity);

  const pageKeys = (['home', 'about', 'services', 'gallery', 'contact'] as const).filter((key) => {
    // Keep every core page for a complete site; templates with a lighter
    // blueprint simply carry fewer sections on each page.
    return true;
  });
  const navPages = pageKeys.map((k) => ({ title: PAGE_TITLES[k], slug: k }));

  const deck = buildCopyDeck(ctx);

  const pages: Page[] = pageKeys.map((key) => {
    let sections: Section[];

    if (key === 'home') {
      const flow = template.blueprint.filter((t) => t !== 'nav' && t !== 'footer');
      sections = [
        section('nav', propsFor('nav', ctx, deck, navPages)),
        ...flow.map((t) => section(t, propsFor(t, ctx, deck, navPages))),
        section('footer', propsFor('footer', ctx, deck, navPages)),
      ];
    } else {
      const flow = PAGE_SECTIONS[key];
      sections = [
        section('nav', propsFor('nav', ctx, deck, navPages)),
        ...flow.map((t) => section(t, propsFor(t, ctx, deck, navPages))),
        section('footer', propsFor('footer', ctx, deck, navPages)),
      ];
    }

    return {
      id: sid('page'),
      websiteId,
      title: PAGE_TITLES[key],
      slug: key,
      inNav: true,
      seo: buildSeo(ctx, PAGE_TITLES[key], key === 'home' ? '/' : `/${key}`),
      sections,
      updatedAt: new Date().toISOString(),
    };
  });

  const settings: WebsiteSettings = {
    primaryColor: tokens.accent,
    accentColor: tokens.accent,
    logoText: profile.name,
    logoUrl: profile.logoUrl ?? '',
    fontPair: tokens.headingFont,
    showWeboraBadge: true,
    whatsappFloat: Boolean(profile.whatsapp || profile.phone),
    contactFormEnabled: true,
    mapEmbedEnabled: true,
    bookingEnabled: pack.ctaVerb.toLowerCase().includes('book'),
    social: profile.social ?? {},
  };

  const now = new Date().toISOString();
  const slug = slugify(profile.name) || slugify(INDUSTRY_LABELS[profile.industry]) || 'my-business';

  return {
    id: websiteId,
    userId: input.userId,
    name: profile.name,
    status: 'draft',
    slug,
    industry: profile.industry,
    styleId: input.styleId,
    tokens,
    business: { ...profile, industry: profile.industry },
    settings,
    pages,
    seo: pages[0].seo,
    templateId: template.id,
    updatedAt: now,
    createdAt: now,
    generation: {
      engine: input.engine,
      provider: input.provider,
      model: input.model,
      templateId: template.id,
      generatedAt: now,
      stages: input.stageTimings,
    },
  };
}

export function reStyle(tokens: DesignTokens, styleId: StyleId): { tokens: DesignTokens; styleId: StyleId } {
  const preset = getStyle(styleId);
  return { tokens: preset.tokens, styleId };
}
