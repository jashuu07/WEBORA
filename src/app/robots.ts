import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Everything that should NOT be indexed:
 *   • signed-in areas (they are useless without a session and would waste crawl budget)
 *   • the API (no HTML to index)
 *   • token-bearing auth screens
 * Published customer sites are allowed — they are the product.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/s/', '/templates', '/pricing', '/how-it-works', '/legal/'],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/create',
          '/editor',
          '/editor/',
          '/api/',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/domain/',
        ],
      },
    ],
    sitemap: `${base.replace(/\/$/, '')}/sitemap.xml`,
    host: base.replace(/\/$/, ''),
  };
}
