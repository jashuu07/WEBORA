/**
 * WEBORA — core domain types.
 *
 * These types are the single source of truth shared by:
 *  - the AI/generation service layer      (services/ai)
 *  - the persistence layer                (lib/db)
 *  - the public site renderer             (components/site)
 *  - the visual editor                    (components/editor)
 *
 * The SQL mirror of these shapes lives in `database/migrations`.
 */

/* -------------------------------------------------------------------------- */
/*  Users & auth                                                              */
/* -------------------------------------------------------------------------- */

export type PlanId = 'free' | 'starter' | 'pro';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  avatarColor: string;
  company?: string;
  phone?: string;
  createdAt: string;
}

export interface UserRecord extends User {
  /** bcrypt hash — never leaves the server. */
  passwordHash: string;
  resetToken?: string;
  resetTokenExpiresAt?: string;
}

export type PublicUser = Omit<User, never>;

/* -------------------------------------------------------------------------- */
/*  Business profile (what the owner tells us)                                */
/* -------------------------------------------------------------------------- */

export interface BusinessHours {
  day: string;
  hours: string;
}

export interface SocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

export interface BusinessProfile {
  name: string;
  type: string; // free text, e.g. "Bakery"
  industry: IndustryId;
  description: string;
  city: string;
  country: string;
  services: string[];
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  hours?: BusinessHours[];
  social?: SocialLinks;
  logoUrl?: string;
  currency: string;
  tone: ToneId;
  tags: string[];
}

/* -------------------------------------------------------------------------- */
/*  Industries & templates                                                    */
/* -------------------------------------------------------------------------- */

export type IndustryId =
  | 'bakery'
  | 'restaurant'
  | 'salon'
  | 'gym'
  | 'consultant'
  | 'portfolio'
  | 'realestate'
  | 'photography'
  | 'retail'
  | 'general';

export type ToneId = 'warm' | 'bold' | 'elegant' | 'friendly' | 'professional';

export interface Template {
  id: string;
  name: string;
  industry: IndustryId;
  tagline: string;
  description: string;
  /** Preview artwork (served from /public/img). */
  image: string;
  styleId: StyleId;
  popularity: number;
  /** Sections included, in order. */
  blueprint: SectionType[];
  highlights: string[];
}

/* -------------------------------------------------------------------------- */
/*  Design system                                                             */
/* -------------------------------------------------------------------------- */

export type StyleId =
  | 'warm-artisan'
  | 'noir-luxe'
  | 'fresh-clean'
  | 'bold-energy'
  | 'editorial'
  | 'midnight';

export interface DesignTokens {
  accent: string;
  accentSoft: string;
  ink: string;
  muted: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  headingFont: 'display' | 'sans' | 'mono';
  bodyFont: 'sans' | 'display';
  radius: 'sharp' | 'soft' | 'round';
  density: 'compact' | 'comfortable' | 'airy';
  /** Dark sections vs light sections as the site's base. */
  mode: 'light' | 'dark';
}

export interface StylePreset {
  id: StyleId;
  name: string;
  description: string;
  tokens: DesignTokens;
  swatches: string[];
  bestFor: IndustryId[];
}

/* -------------------------------------------------------------------------- */
/*  Pages & sections                                                          */
/* -------------------------------------------------------------------------- */

export type SectionType =
  | 'nav'
  | 'hero'
  | 'about'
  | 'services'
  | 'menu'
  | 'gallery'
  | 'pricing'
  | 'testimonials'
  | 'hours'
  | 'team'
  | 'stats'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer';

/** Auto-generated control schema kinds used by the editor's inspector. */
export type FieldKind =
  | 'text'
  | 'textarea'
  | 'image'
  | 'color'
  | 'number'
  | 'select'
  | 'toggle'
  | 'list'
  | 'link';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { label: string; value: string }[];
  itemFields?: FieldDef[];
  help?: string;
  min?: number;
  max?: number;
}

export interface Spacing {
  paddingY: 'sm' | 'md' | 'lg' | 'xl';
  paddingX: 'sm' | 'md' | 'lg';
  /** max content width in px */
  width: number;
  align: 'left' | 'center' | 'right';
}

export interface Section {
  id: string;
  type: SectionType;
  /** Variation of the same section type, e.g. hero "split" vs "centered". */
  variant?: string;
  visible: boolean;
  label: string;
  spacing: Spacing;
  props: Record<string, unknown>;
}

export interface Page {
  id: string;
  websiteId: string;
  title: string;
  slug: string;
  /** Rendered in the main navigation when true. */
  inNav: boolean;
  seo: SeoMeta;
  sections: Section[];
  updatedAt: string;
}

export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: string;
  keywords: string[];
  slug: string;
}

export interface WebsiteSettings {
  primaryColor: string;
  accentColor: string;
  logoText: string;
  logoUrl?: string;
  fontPair: 'display' | 'sans' | 'mono';
  showWeboraBadge: boolean;
  whatsappFloat: boolean;
  contactFormEnabled: boolean;
  mapEmbedEnabled: boolean;
  bookingEnabled: boolean;
  customCss?: string;
  social: SocialLinks;
}

export type WebsiteStatus = 'draft' | 'published';

export interface AnalyticsSummary {
  visitors: number;
  pageViews: number;
  avgTimeSeconds: number;
  bounceRate: number;
  topPages: { path: string; views: number }[];
  devices: { device: string; share: number }[];
  sources: { source: string; share: number }[];
  series: { date: string; visitors: number; pageViews: number }[];
  /** true → numbers come from WEBORA's own first-party event log. */
  firstParty: boolean;
}

export interface Website {
  id: string;
  userId: string;
  name: string;
  status: WebsiteStatus;
  slug: string;
  industry: IndustryId;
  styleId: StyleId;
  tokens: DesignTokens;
  business: BusinessProfile;
  settings: WebsiteSettings;
  pages: Page[];
  seo: SeoMeta;
  templateId: string;
  domain?: DomainRecord;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  /** Provenance of the generated content — surfaced honestly in the UI. */
  generation: GenerationMeta;
  thumbnail?: string;
}

export interface GenerationMeta {
  engine: 'local' | 'ai-provider';
  provider?: string;
  model?: string;
  templateId: string;
  generatedAt: string;
  stages: { id: string; label: string; ms: number }[];
}

/* -------------------------------------------------------------------------- */
/*  Domains, assets, analytics                                                */
/* -------------------------------------------------------------------------- */

export type DomainStatus = 'unverified' | 'pending' | 'active' | 'error';

export interface DomainRecord {
  id: string;
  websiteId: string;
  hostname: string;
  status: DomainStatus;
  /** DNS records the owner must add for verification. */
  dnsRecords: { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string }[];
  provider: 'vercel' | 'manual';
  verifiedAt?: string;
  lastCheckedAt?: string;
  message?: string;
}

export interface Asset {
  id: string;
  userId: string;
  websiteId?: string;
  name: string;
  mime: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  websiteId: string;
  pageId?: string;
  path: string;
  type: 'pageview';
  referrer?: string;
  device: 'desktop' | 'tablet' | 'mobile';
  country?: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Generation pipeline                                                       */
/* -------------------------------------------------------------------------- */

export interface GenerationStage {
  id: string;
  label: string;
  detail: string;
}

export interface GenerationRequest {
  business: BusinessProfile;
  styleId: StyleId;
  templateId?: string;
  /** Optional page set; defaults to the template blueprint. */
  pagePlan?: ('home' | 'about' | 'services' | 'gallery' | 'contact')[];
}

export interface GenerationResult {
  website: Website;
  stages: { id: string; label: string; ms: number }[];
  engine: GenerationMeta;
}

/* -------------------------------------------------------------------------- */
/*  Billing                                                                   */
/* -------------------------------------------------------------------------- */

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  tagline: string;
  features: string[];
  limits: {
    websites: number;
    pages: number;
    customDomain: boolean;
    analytics: boolean;
    brandingRemoval: boolean;
    aiCredits: number;
  };
  highlight?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Industry content library                                                  */
/* -------------------------------------------------------------------------- */

export interface Offer {
  title: string;
  description: string;
  price?: string;
  icon?: string;
}

export interface MenuItem {
  name: string;
  description: string;
  price: string;
  tag?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

export interface Faq {
  q: string;
  a: string;
}

export interface IndustryPack {
  id: IndustryId;
  label: string;
  emoji: string;
  icon: string;
  ctaVerb: string;
  offersHeading: string;
  offersSub: string;
  heroEyebrow: string;
  heroLines: string[];
  heroSub: string;
  aboutHeading: string;
  aboutBody: string;
  aboutBullets: string[];
  offers: Offer[];
  menu?: { heading: string; categories: MenuCategory[] };
  testimonials: Testimonial[];
  faqs: Faq[];
  stats: { value: string; label: string }[];
  hours: BusinessHours[];
  seoTerms: string[];
  primaryCta: string;
  secondaryCta: string;
  galleryCaptions: string[];
  promise: string;
  defaultTone: ToneId;
}
