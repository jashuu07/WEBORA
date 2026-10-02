import type { Page, Section, User, Website } from '@/types';
import { getStore } from '@/lib/db';
import { PLANS } from '@/lib/plans';
import { slugify } from '@/lib/utils';

/** Shared server-side helpers for website routes. */

export async function getOwnedWebsite(id: string, userId: string): Promise<Website | null> {
  const site = await getStore().getWebsite(id);
  if (!site || site.userId !== userId) return null;
  return site;
}

export async function uniqueSlug(desired: string, exceptId?: string): Promise<string> {
  const store = getStore();
  const base = slugify(desired) || 'my-business';
  let candidate = base;
  let n = 1;
  while (await store.slugTaken(candidate, exceptId)) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 60) {
      candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  return candidate;
}

export function planLimits(user: User) {
  return PLANS[user.plan].limits;
}

export async function canCreateWebsite(user: User) {
  const limit = planLimits(user).websites;
  const count = await getStore().countWebsites(user.id);
  return { allowed: count < limit, count, limit };
}

/** Ensure ids are unique after a client round-trip. */
export function normalisePages(pages: Page[], websiteId: string): Page[] {
  const seenPages = new Set<string>();
  return pages.map((page) => {
    let id = page.id || `page_${Math.random().toString(36).slice(2, 10)}`;
    while (seenPages.has(id)) id = `page_${Math.random().toString(36).slice(2, 10)}`;
    seenPages.add(id);

    const seenSections = new Set<string>();
    const sections: Section[] = page.sections.map((section) => {
      let sectionId = section.id || `${section.type}_${Math.random().toString(36).slice(2, 10)}`;
      while (seenSections.has(sectionId)) sectionId = `${section.type}_${Math.random().toString(36).slice(2, 10)}`;
      seenSections.add(sectionId);
      return { ...section, id: sectionId };
    });

    return { ...page, id, websiteId, sections, updatedAt: new Date().toISOString() };
  });
}

export function findSection(website: Website, pageId: string, sectionId: string) {
  const page = website.pages.find((p) => p.id === pageId);
  if (!page) return null;
  const index = page.sections.findIndex((s) => s.id === sectionId);
  if (index === -1) return null;
  return { page, section: page.sections[index], index };
}

/**
 * Custom-domain DNS instructions.
 * A/CNAME targets are the deployment's ingress; TXT is the ownership proof.
 */
export function dnsInstructions(hostname: string) {
  const apex = hostname.split('.').length === 2;
  const target = process.env.WEBORA_INGRESS_TARGET ?? 'cname.webora.app';
  return {
    records: [
      apex
        ? { type: 'A' as const, name: '@', value: process.env.WEBORA_INGRESS_IP ?? '76.76.21.21' }
        : { type: 'CNAME' as const, name: hostname.split('.')[0], value: target },
      { type: 'TXT' as const, name: '_webora', value: `webora-verify=${hashHost(hostname)}` },
    ],
    // Surfaced in the UI so the owner knows exactly what still has to be set up.
    requirements: [
      'The domain must be added to your hosting project (Vercel: Project → Domains).',
      'Point the DNS record shown above at your hosting target and wait for propagation (usually under an hour).',
      'WEBORA checks the record automatically and flips the status to Active once it resolves.',
    ],
  };
}

function hashHost(hostname: string): string {
  let h = 0;
  for (let i = 0; i < hostname.length; i++) h = (h * 31 + hostname.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function sitePublicPath(website: Website) {
  return `/s/${website.slug}`;
}

export function sitePagePath(website: Website, page: Page) {
  return page.slug === 'home' ? `/s/${website.slug}` : `/s/${website.slug}/${page.slug}`;
}
