import type { PlanDefinition, PlanId } from '@/types';

/**
 * Pricing model. Amounts are illustrative positioning — WEBORA never charges
 * unless PAYMENTS_PROVIDER is configured (see docs/PAYMENTS.md).
 */
export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'INR',
    tagline: 'Launch your first site today — no card needed.',
    features: [
      '1 published website',
      '5 pages, all core sections',
      'Full visual editor + device previews',
      'WhatsApp, call and Maps buttons',
      'WEBORA badge on the site',
      'Local AI generation engine',
    ],
    limits: {
      websites: 1,
      pages: 5,
      customDomain: false,
      analytics: false,
      brandingRemoval: false,
      aiCredits: 10,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 499,
    priceYearly: 4990,
    currency: 'INR',
    tagline: 'For growing businesses that need their own brand.',
    features: [
      '3 websites',
      '15 pages each — services, pricing, galleries',
      'Your logo, colours and fonts',
      'Basic SEO pack + sitemap',
      'Contact form + WhatsApp enquiries',
      'Unlimited regenerations',
    ],
    limits: {
      websites: 3,
      pages: 15,
      customDomain: false,
      analytics: false,
      brandingRemoval: true,
      aiCredits: 200,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 999,
    priceYearly: 9990,
    currency: 'INR',
    tagline: 'Custom domain, analytics and advanced AI generation.',
    features: [
      '10 websites',
      'Unlimited pages',
      'Custom domain + SSL',
      'Advanced AI generation',
      'First-party analytics dashboard',
      'Priority support and new features',
    ],
    limits: {
      websites: 10,
      pages: 999,
      customDomain: true,
      analytics: true,
      brandingRemoval: true,
      aiCredits: 2000,
    },
  },
};

export const PLAN_LIST = [PLANS.free, PLANS.starter, PLANS.pro];
export const CURRENCY = 'INR';
