import { revalidatePath } from 'next/cache';
import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, serverError } from '@/lib/api';
import { getOwnedWebsite, sitePublicPath, uniqueSlug } from '@/lib/sites';
import { auditResponsiveness } from '@/services/ai';

export const runtime = 'nodejs';

/**
 * POST /api/sites/:id/publish   body: { action: 'publish' | 'unpublish' }
 *
 * Publishing flips the site to `published` and returns its live URL. A
 * pre-flight check blocks publishing when a page has no content, so we never
 * send a broken site live.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const body = (await request.json().catch(() => ({}))) as { action?: 'publish' | 'unpublish' };
    const action = body.action ?? 'publish';

    if (action === 'unpublish') {
      const saved = await getStore().updateWebsite(site.id, { status: 'draft' });
      // The sitemap only lists live websites, so it must be rebuilt on both
      // transitions — otherwise a just-published site waits for the next ISR tick.
      revalidatePath('/sitemap.xml');
      return ok({ website: saved, published: false });
    }

    const audit = auditResponsiveness(site);
    const blocking = site.pages.filter((p) => p.sections.filter((s) => s.visible).length === 0);
    if (blocking.length) {
      return fail(
        `These pages have no visible sections yet: ${blocking.map((p) => p.title).join(', ')}. Add a section before publishing.`,
        422,
      );
    }

    const slug = await uniqueSlug(site.slug, site.id);
    const saved = await getStore().updateWebsite(site.id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      slug,
    });
    revalidatePath('/sitemap.xml');

    return ok({
      website: saved,
      published: true,
      url: sitePublicPath({ ...site, slug }),
      audit,
      checks: {
        pages: site.pages.length,
        sections: site.pages.reduce((n, p) => n + p.sections.filter((s) => s.visible).length, 0),
        seoReady: site.pages.every((p) => p.seo.title && p.seo.description),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
