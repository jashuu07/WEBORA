import type { BusinessProfile, Website, StyleId } from '@/types';
import { generateWebsite } from '@/services/ai';

/**
 * Demo websites for the marketing pages.
 *
 * These are produced by the *real* generation pipeline at request time, so the
 * previews on the landing page are genuine WEBORA output rather than mockups.
 * Nothing is persisted and no account is required.
 */

export interface DemoSpec {
  key: string;
  label: string;
  profile: BusinessProfile;
  styleId: StyleId;
  templateId: string;
  /** How many sections of the home page to keep for the mini preview. */
  sections: number;
}

const BASE: Omit<BusinessProfile, 'name' | 'type' | 'industry' | 'description' | 'services' | 'city'> = {
  country: 'India',
  currency: 'INR',
  tone: 'warm',
  tags: [],
};

export const DEMO_SPECS: DemoSpec[] = [
  {
    key: 'bakery',
    label: 'Bakery',
    styleId: 'warm-artisan',
    templateId: 'tpl-bakery',
    sections: 6,
    profile: {
      ...BASE,
      name: 'The Bakery House',
      type: 'Bakery',
      industry: 'bakery',
      city: 'Hyderabad',
      description:
        'I own a bakery in Hyderabad. We sell cakes, pastries and coffee. Everything is baked fresh every morning in small batches.',
      services: ['Celebration Cakes', 'Fresh Pastries', 'Artisan Breads', 'Coffee & Cold Brews'],
      phone: '+91 98490 12345',
      whatsapp: '+91 98490 12345',
      email: 'hello@thebakeryhouse.in',
      address: 'Banjara Hills, Hyderabad',
      tone: 'warm',
    },
  },
  {
    key: 'salon',
    label: 'Salon',
    styleId: 'noir-luxe',
    templateId: 'tpl-salon',
    sections: 5,
    profile: {
      ...BASE,
      name: 'Studio Noir',
      type: 'Hair & Beauty Salon',
      industry: 'salon',
      city: 'Bengaluru',
      description:
        'A boutique salon in Bengaluru offering precision haircuts, ammonia-free colour and advanced facials with senior stylists.',
      services: ['Haircut & Styling', 'Hair Colour', 'Advanced Facials', 'Bridal Packages'],
      phone: '+91 98450 22110',
      tone: 'elegant',
    },
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    styleId: 'noir-luxe',
    templateId: 'tpl-restaurant',
    sections: 5,
    profile: {
      ...BASE,
      name: 'Copper & Char',
      type: 'Dum Biryani Restaurant',
      industry: 'restaurant',
      city: 'Hyderabad',
      description:
        'A family-run restaurant famous for Hyderabadi dum biryani, charcoal kebabs and slow-cooked curries. Private dining available.',
      services: ['Dum Biryani', 'Charcoal Kebabs', 'Family Dining', 'Private Events'],
      phone: '+91 90000 45678',
      tone: 'warm',
    },
  },
  {
    key: 'gym',
    label: 'Fitness studio',
    styleId: 'bold-energy',
    templateId: 'tpl-gym',
    sections: 5,
    profile: {
      ...BASE,
      name: 'Iron District',
      type: 'Strength & Conditioning Gym',
      industry: 'gym',
      city: 'Pune',
      description:
        'A performance gym in Pune with certified coaches, structured strength programmes and group classes. Free trial session for new members.',
      services: ['Strength Training', 'Personal Training', 'Group Classes', 'Weight Loss Programme'],
      phone: '+91 98765 11223',
      tone: 'bold',
    },
  },
];

const cache = new Map<string, Website>();

export async function getDemoSite(key: string): Promise<Website | null> {
  const cached = cache.get(key);
  if (cached) return cached;

  const spec = DEMO_SPECS.find((s) => s.key === key);
  if (!spec) return null;

  const result = await generateWebsite({
    userId: 'demo',
    business: spec.profile,
    styleId: spec.styleId,
    templateId: spec.templateId,
  });

  const website = result.website;
  // Keep the preview light: trim the home page to the most representative sections.
  website.pages = website.pages.map((page) => {
    if (page.slug !== 'home') return page;
    const keep = page.sections.slice(0, spec.sections);
    const hasFooter = keep.some((s) => s.type === 'footer');
    const footer = page.sections.find((s) => s.type === 'footer');
    return { ...page, sections: hasFooter || !footer ? keep : [...keep, footer] };
  });

  cache.set(key, website);
  return website;
}

export async function getDemoSites(keys: string[] = ['bakery', 'salon', 'restaurant']): Promise<Website[]> {
  const sites = await Promise.all(keys.map((k) => getDemoSite(k)));
  return sites.filter(Boolean) as Website[];
}
