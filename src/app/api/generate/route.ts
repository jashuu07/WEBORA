import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { generateSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, rateLimit, serverError } from '@/lib/api';
import { generateWebsite, generationEngineStatus } from '@/services/ai';
import { canCreateWebsite, uniqueSlug } from '@/lib/sites';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/generate
 *
 * Runs the full generation pipeline. When `siteId` is supplied the existing
 * site is regenerated in place (pages are replaced, settings and domain are
 * kept). Otherwise a new draft website is created, subject to plan limits.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();

    if (!rateLimit(`generate:${user.id}`, 20, 60_000)) {
      return fail('You are generating very quickly — give it a few seconds.', 429);
    }

    const parsed = await parseJson(request, generateSchema);
    if ('error' in parsed) return fail(parsed.error);

    const store = getStore();
    const existing = parsed.data.siteId ? await store.getWebsite(parsed.data.siteId) : null;

    if (parsed.data.siteId && (!existing || existing.userId !== user.id)) {
      return fail('We could not find that website.', 404);
    }

    if (!existing) {
      const limit = await canCreateWebsite(user);
      if (!limit.allowed) {
        return fail(
          `Your ${user.plan} plan includes ${limit.limit} website${limit.limit === 1 ? '' : 's'}. Delete one or upgrade to create another.`,
          402,
        );
      }
    }

    const result = await generateWebsite({
      userId: user.id,
      websiteId: existing?.id,
      business: parsed.data.business as never,
      styleId: parsed.data.styleId as never,
      templateId: parsed.data.templateId,
      businessTypeHint: parsed.data.businessTypeHint,
    });

    const website = result.website;

    if (existing) {
      // Regeneration keeps identity, settings, domain and publish state.
      website.slug = existing.slug;
      website.status = existing.status;
      website.publishedAt = existing.publishedAt;
      website.domain = existing.domain;
      website.settings = {
        ...existing.settings,
        logoText: existing.settings.logoText || website.settings.logoText,
        logoUrl: existing.settings.logoUrl || website.settings.logoUrl,
      };
      website.createdAt = existing.createdAt;
      website.thumbnail = existing.thumbnail;
      const saved = await store.updateWebsite(existing.id, website);
      return ok({
        website: saved,
        stages: result.stages,
        audit: result.audit,
        engine: result.engine,
        detectedIndustry: result.detectedIndustry,
        regenerated: true,
      });
    }

    website.slug = await uniqueSlug(website.slug, website.id);
    const saved = await store.createWebsite(website);
    // A brand-new site starts with an empty analytics panel (an honest zero
    // state). Demo numbers belong to the clearly-labelled sample site only.
    return ok(
      {
        website: saved,
        stages: result.stages,
        audit: result.audit,
        engine: result.engine,
        detectedIndustry: result.detectedIndustry,
        generationStatus: generationEngineStatus(),
        regenerated: false,
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error, 'Generation failed. Please try again.');
  }
}

/** GET → what engine will be used, shown in the wizard before generating. */
export async function GET() {
  return ok(generationEngineStatus());
}
