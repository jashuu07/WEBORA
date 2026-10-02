import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, serverError } from '@/lib/api';
import { getOwnedWebsite } from '@/lib/sites';

export const runtime = 'nodejs';

/**
 * GET /api/sites/:id/analytics?days=30
 *
 * First-party analytics recorded by the published site itself. When the only
 * events present are the sample-site seeder's, `firstParty` is false and the UI
 * labels the panel "Demo data".
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const days = Math.min(180, Math.max(7, Number(new URL(request.url).searchParams.get('days') ?? 30)));
    const summary = await getStore().getAnalytics(site.id, days);

    const published = site.status === 'published';
    return ok({
      summary,
      days,
      published,
      empty: summary.pageViews === 0,
      // Explains the zero state instead of showing a fake graph.
      emptyReason: !published
        ? 'This website is still a draft. Analytics start recording once it is published and visitors arrive.'
        : 'No visits recorded yet in this window. Share your website link to start collecting data.',
      tracking: {
        mode: 'first-party' as const,
        note: 'Page views are recorded by WEBORA itself — no third-party analytics script is loaded.',
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
