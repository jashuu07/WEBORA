import { getStore } from '@/lib/db';
import { detectDevice, clientIp, ok, rateLimit } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * POST /api/public/:slug/track
 *
 * First-party page-view recording for published sites. No cookies, no
 * fingerprinting: we store the path, device class and referrer host only.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const store = getStore();
    const site = await store.getWebsiteBySlug(slug);
    if (!site || site.status !== 'published') {
      return Response.json({ ok: true, recorded: false });
    }

    if (!rateLimit(`track:${clientIp(request)}`, 120, 60_000)) {
      return Response.json({ ok: true, recorded: false });
    }

    const body = (await request.json().catch(() => ({}))) as { path?: string; referrer?: string };
    const page = site.pages.find((p) => `/${p.slug}` === body.path || (p.slug === 'home' && body.path === '/'));

    await store.recordEvent({
      id: `ev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
      websiteId: site.id,
      pageId: page?.id,
      path: body.path?.slice(0, 200) ?? '/',
      type: 'pageview',
      referrer: body.referrer?.slice(0, 300),
      device: detectDevice(request.headers.get('user-agent')),
      country: request.headers.get('x-vercel-ip-country') ?? undefined,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ ok: true, recorded: true });
  } catch {
    // Analytics must never break a visitor's page load.
    return Response.json({ ok: true, recorded: false });
  }
}
