/**
 * Stock imagery catalogue (pure data — safe for client and server).
 *
 * WEBORA ships with sample photography in `public/img` so a freshly generated
 * website looks complete before the owner uploads anything. Owners replace any
 * tile from the editor; uploads go through /api/assets.
 *
 * Files on disk are checked in `stock-server.ts`, which is the module the
 * generation pipeline and the editor page actually use — this module only
 * describes the intent.
 */

export interface StockImage {
  url: string;
  label: string;
  industry: string;
}

export const STOCK_IMAGES: StockImage[] = [
  { url: '/img/bakery-hero.jpg', label: 'Bakery counter', industry: 'bakery' },
  { url: '/img/bakery-detail.jpg', label: 'Sourdough detail', industry: 'bakery' },
  { url: '/img/restaurant-hero.jpg', label: 'Restaurant dining', industry: 'restaurant' },
  { url: '/img/restaurant-detail.jpg', label: 'Plated dish', industry: 'restaurant' },
  { url: '/img/salon-hero.jpg', label: 'Salon interior', industry: 'salon' },
  { url: '/img/salon-detail.jpg', label: 'Styling', industry: 'salon' },
  { url: '/img/gym-hero.jpg', label: 'Gym floor', industry: 'gym' },
  { url: '/img/gym-detail.jpg', label: 'Training detail', industry: 'gym' },
  { url: '/img/consultant-hero.jpg', label: 'Consulting office', industry: 'consultant' },
  { url: '/img/consultant-detail.jpg', label: 'Workshop', industry: 'consultant' },
  { url: '/img/portfolio-hero.jpg', label: 'Design desk', industry: 'portfolio' },
  { url: '/img/portfolio-detail.jpg', label: 'Brand materials', industry: 'portfolio' },
  { url: '/img/realestate-hero.jpg', label: 'Property exterior', industry: 'realestate' },
  { url: '/img/realestate-detail.jpg', label: 'Interior', industry: 'realestate' },
  { url: '/img/photography-hero.jpg', label: 'On location', industry: 'photography' },
  { url: '/img/photography-detail.jpg', label: 'Camera detail', industry: 'photography' },
  { url: '/img/retail-hero.jpg', label: 'Store interior', industry: 'retail' },
  { url: '/img/retail-detail.jpg', label: 'Shelf styling', industry: 'retail' },
];

/** Imagery an industry should use, in order: hero first, then supporting shots. */
export const INDUSTRY_STOCK: Record<string, string[]> = {
  bakery: ['/img/bakery-hero.jpg', '/img/bakery-detail.jpg'],
  restaurant: ['/img/restaurant-hero.jpg', '/img/restaurant-detail.jpg'],
  salon: ['/img/salon-hero.jpg', '/img/salon-detail.jpg'],
  gym: ['/img/gym-hero.jpg', '/img/gym-detail.jpg'],
  consultant: ['/img/consultant-hero.jpg', '/img/consultant-detail.jpg'],
  portfolio: ['/img/portfolio-hero.jpg', '/img/portfolio-detail.jpg'],
  realestate: ['/img/realestate-hero.jpg', '/img/realestate-detail.jpg'],
  photography: ['/img/photography-hero.jpg', '/img/photography-detail.jpg'],
  retail: ['/img/retail-hero.jpg', '/img/retail-detail.jpg'],
  general: ['/img/retail-hero.jpg', '/img/consultant-detail.jpg'],
};

export function industryStockImages(industry: string): string[] {
  return INDUSTRY_STOCK[industry] ?? INDUSTRY_STOCK.general;
}
