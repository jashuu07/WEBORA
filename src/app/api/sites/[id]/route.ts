import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { websitePatchSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';
import { getOwnedWebsite, normalisePages, uniqueSlug } from '@/lib/sites';
import { getStyle } from '@/lib/design/styles';
import type { Page, StyleId } from '@/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);
    return ok({ website: site });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * PATCH /api/sites/:id
 *
 * The editor autosaves the full `pages` array here; name/slug/style/settings
 * can be updated in the same request.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const parsed = await parseJson(request, websitePatchSchema);
    if ('error' in parsed) return fail(parsed.error);
    const patch = parsed.data;

    const updates: Record<string, unknown> = {};

    if (patch.name) updates.name = patch.name;

    if (patch.slug && patch.slug !== site.slug) {
      updates.slug = await uniqueSlug(patch.slug, site.id);
    }

    if (patch.styleId && patch.styleId !== site.styleId) {
      const preset = getStyle(patch.styleId as StyleId);
      updates.styleId = preset.id;
      updates.tokens = preset.tokens;
      updates.settings = {
        ...site.settings,
        primaryColor: preset.tokens.accent,
        accentColor: preset.tokens.accent,
      };
    }

    if (patch.tokens) {
      updates.tokens = { ...site.tokens, ...(patch.tokens as Record<string, unknown>) };
      updates.settings = {
        ...site.settings,
        primaryColor: String((patch.tokens as Record<string, unknown>).accent ?? site.settings.primaryColor),
        accentColor: String((patch.tokens as Record<string, unknown>).accent ?? site.settings.accentColor),
      };
    }

    if (patch.pages) {
      updates.pages = normalisePages(patch.pages as Page[], site.id);
    }

    if (patch.settings) {
      updates.settings = { ...site.settings, ...patch.settings };
    }

    if (patch.seo) {
      updates.seo = { ...site.seo, ...patch.seo };
    }

    if (patch.business) {
      updates.business = { ...site.business, ...patch.business };
    }

    if (patch.status) {
      updates.status = patch.status;
      if (patch.status === 'published' && !site.publishedAt) {
        updates.publishedAt = new Date().toISOString();
      }
    }

    const saved = await getStore().updateWebsite(site.id, updates);
    return ok({ website: saved, savedAt: new Date().toISOString() });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    await getStore().deleteWebsite(id);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
