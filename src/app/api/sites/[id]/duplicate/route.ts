import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, serverError } from '@/lib/api';
import { canCreateWebsite, getOwnedWebsite } from '@/lib/sites';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const limit = await canCreateWebsite(user);
    if (!limit.allowed) {
      return fail(`You have reached the ${limit.limit}-website limit on the ${user.plan} plan.`, 402);
    }

    const copy = await getStore().duplicateWebsite(id, user.id);
    if (!copy) return fail('We could not duplicate that website.', 400);

    return ok({ website: copy }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
