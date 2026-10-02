import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { pageSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';
import { getOwnedWebsite, normalisePages } from '@/lib/sites';
import { PAGE_SECTIONS } from '@/lib/templates/catalog';
import { section } from '@/services/ai/local-engine/assemble';
import { buildSeo, makeContext } from '@/services/ai/local-engine/copywriter';
import { getPack } from '@/lib/industry/packs';
import { PLANS } from '@/lib/plans';
import type { Page, SectionType } from '@/types';

export const runtime = 'nodejs';

/** POST /api/sites/:id/pages → add a page to a site. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const limit = PLANS[user.plan].limits.pages;
    if (site.pages.length >= limit) {
      return fail(`Your ${user.plan} plan allows ${limit} pages per website. Upgrade to add more.`, 402);
    }

    const parsed = await parseJson(request, pageSchema);
    if ('error' in parsed) return fail(parsed.error);
    const { title, slug, inNav, preset } = parsed.data;

    if (site.pages.some((p) => p.slug === slug)) {
      return fail(`A page with the address “${slug}” already exists.`);
    }

    const ctx = makeContext(site.business, getPack(site.industry), 3);
    const presetSections: SectionType[] =
      preset === 'blank' ? ['about'] : PAGE_SECTIONS[preset as keyof typeof PAGE_SECTIONS] ?? ['about'];

    const page: Page = {
      id: `page_${Math.random().toString(36).slice(2, 10)}`,
      websiteId: site.id,
      title,
      slug,
      inNav: inNav ?? true,
      seo: buildSeo(ctx, title, `/${slug}`),
      sections: presetSections.map((type) => {
        const base = section(type, {});
        // Reuse the home page's props for the same section type when available.
        const donor = site.pages
          .flatMap((p) => p.sections)
          .find((s) => s.type === type && Object.keys(s.props).length > 1);
        return donor ? { ...base, props: structuredClone(donor.props), label: donor.label } : base;
      }),
      updatedAt: new Date().toISOString(),
    };

    const saved = await getStore().updateWebsite(site.id, {
      pages: normalisePages([...site.pages, page], site.id),
    });
    return ok({ website: saved, page }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE /api/sites/:id/pages?pageId=... */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const pageId = new URL(request.url).searchParams.get('pageId');
    if (!pageId) return fail('Which page should be deleted?');

    const page = site.pages.find((p) => p.id === pageId);
    if (!page) return fail('Page not found.', 404);
    if (page.slug === 'home') return fail('The home page cannot be deleted — edit it instead.');
    if (site.pages.length <= 1) return fail('A website needs at least one page.');

    const remaining = site.pages.filter((p) => p.id !== pageId);
    const saved = await getStore().updateWebsite(site.id, { pages: normalisePages(remaining, site.id) });
    return ok({ website: saved, deletedPageId: pageId });
  } catch (error) {
    return serverError(error);
  }
}
