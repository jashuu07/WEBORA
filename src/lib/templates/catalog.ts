import type { IndustryId, SectionType, StyleId, Template } from '@/types';

/**
 * Template catalogue — 9 industry starting points.
 *
 * A template is a *blueprint*, not a fixed page: it decides section order,
 * imagery and the recommended style preset. The generation engine then writes
 * real copy into those sections using the owner's business profile.
 */
export const TEMPLATES: Template[] = [
  {
    id: 'tpl-bakery',
    name: 'Golden Crumb',
    industry: 'bakery',
    tagline: 'Warm artisan bakery & café',
    description:
      'A bakery site built around appetite: full-bleed hero, menu with prices, gallery of the bake and a strong order CTA.',
    image: '/img/bakery-hero.jpg',
    styleId: 'warm-artisan',
    popularity: 96,
    blueprint: ['nav', 'hero', 'stats', 'services', 'menu', 'gallery', 'testimonials', 'hours', 'cta', 'contact', 'footer'],
    highlights: ['Menu with prices', 'Order CTA', 'Opening hours + map', 'Gallery of the bake'],
  },
  {
    id: 'tpl-restaurant',
    name: 'Copper Table',
    industry: 'restaurant',
    tagline: 'Upscale dining & reservations',
    description:
      'Dark, appetising and reservation-led. Menu categories, private dining, reviews and a booking-first hero.',
    image: '/img/restaurant-hero.jpg',
    styleId: 'noir-luxe',
    popularity: 94,
    blueprint: ['nav', 'hero', 'about', 'menu', 'gallery', 'testimonials', 'hours', 'cta', 'contact', 'footer'],
    highlights: ['Signature menu', 'Table booking CTA', 'Private dining', 'Review wall'],
  },
  {
    id: 'tpl-salon',
    name: 'Studio Noir',
    industry: 'salon',
    tagline: 'Salon, spa & bridal studio',
    description:
      'Service-and-price led with a booking CTA in every band, plus a bridal package section that converts.',
    image: '/img/salon-hero.jpg',
    styleId: 'noir-luxe',
    popularity: 91,
    blueprint: ['nav', 'hero', 'services', 'pricing', 'gallery', 'testimonials', 'team', 'hours', 'contact', 'footer'],
    highlights: ['Service + price list', 'Bridal packages', 'Stylist profiles', 'Instant booking'],
  },
  {
    id: 'tpl-gym',
    name: 'Iron District',
    industry: 'gym',
    tagline: 'Gym, PT & group classes',
    description:
      'High-contrast and performance-driven. Programme cards, transformation proof and a free-trial CTA.',
    image: '/img/gym-hero.jpg',
    styleId: 'bold-energy',
    popularity: 89,
    blueprint: ['nav', 'hero', 'stats', 'services', 'pricing', 'gallery', 'testimonials', 'faq', 'cta', 'contact', 'footer'],
    highlights: ['Programme cards', 'Membership pricing', 'Coach profiles', 'Free trial CTA'],
  },
  {
    id: 'tpl-consultant',
    name: 'Northwind',
    industry: 'consultant',
    tagline: 'Consultant & professional services',
    description:
      'Credibility-first: scoped engagements, proof numbers, FAQs and a booking call CTA. Feels senior, not salesy.',
    image: '/img/consultant-hero.jpg',
    styleId: 'midnight',
    popularity: 87,
    blueprint: ['nav', 'hero', 'stats', 'services', 'about', 'testimonials', 'faq', 'cta', 'contact', 'footer'],
    highlights: ['Scoped engagements', 'Proof numbers', 'FAQ objections', 'Book a call'],
  },
  {
    id: 'tpl-portfolio',
    name: 'Atelier',
    industry: 'portfolio',
    tagline: 'Designer & creative portfolio',
    description:
      'Editorial grid with generous whitespace. Work comes first, biography second, enquiry last.',
    image: '/img/portfolio-hero.jpg',
    styleId: 'editorial',
    popularity: 85,
    blueprint: ['nav', 'hero', 'gallery', 'services', 'about', 'testimonials', 'cta', 'contact', 'footer'],
    highlights: ['Case-study grid', 'Services + rates', 'Client quotes', 'Project enquiry'],
  },
  {
    id: 'tpl-realestate',
    name: 'Skyline',
    industry: 'realestate',
    tagline: 'Property advisory & listings',
    description:
      'Trust-led layout for high-value decisions: services, verified paperwork, reviews and site-visit booking.',
    image: '/img/realestate-hero.jpg',
    styleId: 'midnight',
    popularity: 84,
    blueprint: ['nav', 'hero', 'services', 'stats', 'gallery', 'testimonials', 'about', 'cta', 'contact', 'footer'],
    highlights: ['Listings gallery', 'Site-visit booking', 'Team credentials', 'NRI services'],
  },
  {
    id: 'tpl-photography',
    name: 'Lightbox',
    industry: 'photography',
    tagline: 'Photography & film',
    description:
      'Image-forward with a mosaic gallery and packages, tuned for bookings and date enquiries.',
    image: '/img/photography-hero.jpg',
    styleId: 'editorial',
    popularity: 88,
    blueprint: ['nav', 'hero', 'gallery', 'services', 'pricing', 'testimonials', 'faq', 'contact', 'footer'],
    highlights: ['Mosaic portfolio', 'Shoot packages', 'Availability CTA', 'Client reviews'],
  },
  {
    id: 'tpl-retail',
    name: 'Corner Store',
    industry: 'retail',
    tagline: 'Local shop & online catalogue',
    description:
      'Friendly and fast: what you stock, delivery promise, store hours and a WhatsApp order button.',
    image: '/img/retail-hero.jpg',
    styleId: 'warm-artisan',
    popularity: 82,
    blueprint: ['nav', 'hero', 'services', 'gallery', 'testimonials', 'hours', 'contact', 'footer'],
    highlights: ['Product categories', 'Delivery promise', 'Store hours', 'WhatsApp orders'],
  },
];

export function getTemplate(id: string | undefined): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function templatesForIndustry(industry: IndustryId): Template[] {
  const exact = TEMPLATES.filter((t) => t.industry === industry);
  return exact.length ? exact : TEMPLATES.slice(0, 3);
}

/**
 * Template recommendation: industry match first, then style affinity, then
 * popularity. Returns a ranked list so the UI can show "recommended" + others.
 */
export function recommendTemplates(industry: IndustryId, styleId?: StyleId): Template[] {
  return [...TEMPLATES]
    .map((t) => {
      let score = t.popularity / 100;
      if (t.industry === industry) score += 1.2;
      if (styleId && t.styleId === styleId) score += 0.5;
      if (industry === 'restaurant' && t.industry === 'bakery') score += 0.2;
      if (industry === 'salon' && t.industry === 'photography') score += 0.15;
      if (industry === 'retail' && t.industry === 'bakery') score += 0.15;
      if (industry === 'gym' && t.industry === 'photography') score += 0.1;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.t);
}

export const INDUSTRY_LABELS: Record<IndustryId, string> = {
  bakery: 'Bakery',
  restaurant: 'Restaurant',
  salon: 'Salon & Spa',
  gym: 'Gym & Fitness',
  consultant: 'Consultant',
  portfolio: 'Portfolio',
  realestate: 'Real Estate',
  photography: 'Photography',
  retail: 'Local Shop',
  general: 'Local Business',
};

/** Pages produced by default, mapped from the template blueprint. */
export const DEFAULT_PAGE_PLAN = ['home', 'about', 'services', 'gallery', 'contact'] as const;
export type PagePlanKey = (typeof DEFAULT_PAGE_PLAN)[number];

export const PAGE_TITLES: Record<PagePlanKey, string> = {
  home: 'Home',
  about: 'About',
  services: 'Services',
  gallery: 'Gallery',
  contact: 'Contact',
};

/** Which sections each non-home page carries. */
export const PAGE_SECTIONS: Record<Exclude<PagePlanKey, 'home'>, SectionType[]> = {
  about: ['about', 'stats', 'team', 'testimonials', 'cta'],
  services: ['services', 'pricing', 'faq', 'cta', 'contact'],
  gallery: ['gallery', 'testimonials', 'cta'],
  contact: ['contact', 'hours', 'faq'],
};
