import type { BusinessProfile, StyleId, Website } from '@/types';
import { generateWebsite } from '@/services/ai';
import { getStore } from '@/lib/db';
import { uniqueSlug } from '@/lib/sites';
import { seededRandom } from '@/lib/utils';

/**
 * Sample website generator.
 *
 * Runs the *real* generation pipeline with an example business profile so a new
 * account can see a complete site (and a populated dashboard) in one click.
 * Analytics attached to a sample site are clearly marked as demo data.
 */

export const SAMPLE_PROFILE: BusinessProfile = {
  name: 'The Bakery House',
  type: 'Bakery',
  industry: 'bakery',
  description:
    'I own a bakery in Hyderabad. We sell cakes, pastries and coffee. Everything is baked fresh every morning in small batches, and we take custom celebration cake orders.',
  city: 'Hyderabad',
  country: 'India',
  services: ['Celebration Cakes', 'Fresh Pastries', 'Artisan Breads', 'Coffee & Cold Brews', 'Custom Orders'],
  phone: '+91 98490 12345',
  email: 'hello@thebakeryhouse.in',
  whatsapp: '+91 98490 12345',
  address: 'Plot 42, Road No. 12, Banjara Hills, Hyderabad',
  currency: 'INR',
  tone: 'warm',
  tags: ['bakery', 'cakes', 'coffee'],
  social: { instagram: 'https://instagram.com/thebakeryhouse' },
};

export interface SeedOptions {
  sample?: boolean;
  templateId?: string;
  styleId?: StyleId;
}

/** Generate + persist a website for a user. Returns the stored site. */
export async function createSampleWebsite(userId: string, options: SeedOptions = {}): Promise<Website> {
  const store = getStore();
  const profile: BusinessProfile = options.sample === false ? SAMPLE_PROFILE : SAMPLE_PROFILE;

  const result = await generateWebsite({
    userId,
    business: profile,
    styleId: options.styleId ?? 'warm-artisan',
    templateId: options.templateId ?? 'tpl-bakery',
  });

  const website = result.website;
  website.status = 'draft';
  // A clean, believable name is part of the sample's job — uniqueness belongs to
  // the slug, not to the business name.
  website.slug = await uniqueSlug(website.slug);
  const saved = await store.createWebsite(website);
  await seedAnalytics(saved.id, 45);
  return saved;
}

/**
 * Backdated page-view events so the analytics dashboard is demonstrable.
 * Event ids are prefixed with `demo_` and the API reports them as demo data.
 */
export async function seedAnalytics(websiteId: string, totalEvents = 40) {
  const store = getStore();
  const rand = seededRandom(websiteId);
  const paths = ['/', '/about', '/services', '/gallery', '/contact'];
  const weights = [0.46, 0.16, 0.18, 0.12, 0.08];
  const devices: ('mobile' | 'desktop' | 'tablet')[] = ['mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
  const referrers = [undefined, 'https://www.google.com/', 'https://instagram.com/', 'https://wa.me/', undefined, 'https://www.bing.com/'];

  for (let i = 0; i < totalEvents; i++) {
    // Weight towards the most recent 14 days.
    const daysAgo = Math.floor(rand() * rand() * 30);
    const created = new Date(Date.now() - daysAgo * 86_400_000 - Math.floor(rand() * 82_800_000));
    const roll = rand();
    let acc = 0;
    let path = paths[0];
    for (let p = 0; p < paths.length; p++) {
      acc += weights[p];
      if (roll <= acc) {
        path = paths[p];
        break;
      }
    }
    await store.recordEvent({
      id: `demo_${websiteId}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      websiteId,
      path,
      type: 'pageview',
      referrer: referrers[Math.floor(rand() * referrers.length)],
      device: devices[Math.floor(rand() * devices.length)],
      country: 'IN',
      createdAt: created.toISOString(),
    });
  }
}
