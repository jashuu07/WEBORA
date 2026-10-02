import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, serverError } from '@/lib/api';
import { getOwnedWebsite } from '@/lib/sites';

export const runtime = 'nodejs';

/** Contact-form submissions captured from the published website. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const enquiries = await getStore().listEnquiries(site.id);
    return ok({ enquiries, unread: enquiries.filter((e) => !e.read).length });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const body = (await request.json().catch(() => ({}))) as { enquiryId?: string; read?: boolean };
    if (!body.enquiryId) return fail('Which enquiry should be updated?');

    await getStore().markEnquiryRead(body.enquiryId, body.read ?? true);
    return ok({ updated: true });
  } catch (error) {
    return serverError(error);
  }
}
