import type { MetadataRoute } from 'next';
import { getStore } from '@/lib/db';

const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const revalidate = 3600;

/**
 * Static marketing pages plus every *published* customer website.
 *
 * Drafts are excluded on purpose: a half-finished site should never be handed to
 * a search engine. Each published page carries its own `lastModified` so crawls
 * pick up edits made in the editor.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/templates`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/data`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let published: MetadataRoute.Sitemap = [];
  try {
    const sites = await getStore().listPublishedSites();
    published = sites.flatMap((site) => {
      const home = {
        url: `${base}/s/${site.slug}`,
        lastModified: new Date(site.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      };
      const subPages = site.pages
        .filter((page) => page.slug !== 'home')
        .map((page) => ({
          url: `${base}/s/${site.slug}/${page.slug}`,
          lastModified: new Date(page.updatedAt),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      return [home, ...subPages];
    });
  } catch {
    // A storage hiccup must not break the sitemap for the marketing pages.
    published = [];
  }

  return [...staticRoutes, ...published];
}
