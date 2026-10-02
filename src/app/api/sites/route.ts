import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, serverError } from '@/lib/api';
import { canCreateWebsite, uniqueSlug } from '@/lib/sites';
import { createSampleWebsite } from '@/lib/seed';
import { generateWebsite } from '@/services/ai';
import { getStyle } from '@/lib/design/styles';
import { getTemplate } from '@/lib/templates/catalog';
import type { BusinessProfile, StyleId } from '@/types';

export const runtime = 'nodejs';

/** GET /api/sites → all websites owned by the signed-in user. */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const websites = await getStore().listWebsites(user.id);
    return ok({ websites });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * POST /api/sites
 * body: { mode: 'sample' }                     → generate the example bakery site
 *       { mode: 'blank', name, industry }      → start an empty site to build manually
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => ({}))) as {
      mode?: 'sample' | 'blank';
      name?: string;
      industry?: string;
      styleId?: StyleId;
    };

    const limit = await canCreateWebsite(user);
    if (!limit.allowed) {
      return fail(
        `Your ${user.plan} plan includes ${limit.limit} website${limit.limit === 1 ? '' : 's'}. Delete one or upgrade to create another.`,
        402,
      );
    }

    if (body.mode === 'sample') {
      const site = await createSampleWebsite(user.id, { styleId: body.styleId });
      return ok({ website: site, sample: true }, { status: 201 });
    }

    // Blank site — same pipeline, minimal profile, so the structure is real.
    const name = (body.name ?? '').trim() || 'My Business';
    const industry = (body.industry ?? 'general') as BusinessProfile['industry'];
    const template = getTemplate(undefined);
    const style = getStyle(body.styleId ?? template.styleId);

    const result = await generateWebsite({
      userId: user.id,
      business: {
        name,
        type: '',
        industry,
        description: `${name} is a business. Edit this description in the editor to fill your pages.`,
        city: '',
        country: 'India',
        services: [],
        currency: 'INR',
        tone: 'professional',
        tags: [],
      },
      styleId: style.id,
      templateId: template.id,
    });

    const website = result.website;
    website.name = name;
    website.slug = await uniqueSlug(website.slug);
    const saved = await getStore().createWebsite(website);
    return ok({ website: saved, sample: false }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
