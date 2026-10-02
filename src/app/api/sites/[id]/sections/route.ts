import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { addSectionSchema, reorderSchema, sectionPatchSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';
import { getOwnedWebsite } from '@/lib/sites';
import { SECTION_DEFS } from '@/lib/sections/schemas';
import { section } from '@/services/ai/local-engine/assemble';
import type { SectionType } from '@/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Section-level operations used by the editor.
 *
 *   PATCH  → update one section's props / visibility / spacing
 *   POST   → add a section from the component library
 *   PUT    → reorder sections on a page
 *   DELETE → remove a section
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const parsed = await parseJson(request, sectionPatchSchema);
    if ('error' in parsed) return fail(parsed.error);
    const { pageId, sectionId, props, visible, spacing, label } = parsed.data;

    const pages = structuredClone(site.pages);
    const page = pages.find((p) => p.id === pageId);
    if (!page) return fail('Page not found.', 404);
    const target = page.sections.find((s) => s.id === sectionId);
    if (!target) return fail('Section not found.', 404);

    if (props) target.props = { ...target.props, ...props };
    if (typeof visible === 'boolean') target.visible = visible;
    if (spacing) target.spacing = { ...target.spacing, ...spacing };
    if (label) target.label = label;
    page.updatedAt = new Date().toISOString();

    const saved = await getStore().updateWebsite(site.id, { pages });
    return ok({ website: saved });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const parsed = await parseJson(request, addSectionSchema);
    if ('error' in parsed) return fail(parsed.error);
    const { pageId, type, index, props } = parsed.data;

    if (!(type in SECTION_DEFS)) return fail(`“${type}” is not a section we can add.`);

    const pages = structuredClone(site.pages);
    const page = pages.find((p) => p.id === pageId);
    if (!page) return fail('Page not found.', 404);

    const created = section(type as SectionType, props ?? {});
    // Sections always sit above the footer.
    const footerIndex = page.sections.findIndex((s) => s.type === 'footer');
    const insertAt =
      typeof index === 'number' && index >= 0
        ? Math.min(index, footerIndex >= 0 ? footerIndex : page.sections.length)
        : footerIndex >= 0
          ? footerIndex
          : page.sections.length;

    page.sections.splice(insertAt, 0, created);
    page.updatedAt = new Date().toISOString();

    const saved = await getStore().updateWebsite(site.id, { pages });
    return ok({ website: saved, section: created }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const parsed = await parseJson(request, reorderSchema);
    if ('error' in parsed) return fail(parsed.error);
    const { pageId, order } = parsed.data;

    const pages = structuredClone(site.pages);
    const page = pages.find((p) => p.id === pageId);
    if (!page) return fail('Page not found.', 404);

    const byId = new Map(page.sections.map((s) => [s.id, s]));
    const reordered = order.map((sid) => byId.get(sid)).filter(Boolean) as typeof page.sections;
    // Anything the client did not list keeps its relative position at the end.
    const leftovers = page.sections.filter((s) => !order.includes(s.id));
    page.sections = [...reordered, ...leftovers];
    page.updatedAt = new Date().toISOString();

    const saved = await getStore().updateWebsite(site.id, { pages });
    return ok({ website: saved });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const url = new URL(request.url);
    const pageId = url.searchParams.get('pageId');
    const sectionId = url.searchParams.get('sectionId');
    if (!pageId || !sectionId) return fail('pageId and sectionId are required.');

    const pages = structuredClone(site.pages);
    const page = pages.find((p) => p.id === pageId);
    if (!page) return fail('Page not found.', 404);

    const target = page.sections.find((s) => s.id === sectionId);
    if (!target) return fail('Section not found.', 404);
    if (target.type === 'nav' || target.type === 'footer') {
      return fail('Navigation and footer are structural — hide them instead of deleting.');
    }

    page.sections = page.sections.filter((s) => s.id !== sectionId);
    page.updatedAt = new Date().toISOString();

    const saved = await getStore().updateWebsite(site.id, { pages });
    return ok({ website: saved, deletedSectionId: sectionId });
  } catch (error) {
    return serverError(error);
  }
}
