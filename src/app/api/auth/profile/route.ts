import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { profileSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const websites = await getStore().countWebsites(user.id);
  return ok({ user, usage: { websites, limit: PLANS[user.plan].limits.websites } });
}

export async function PATCH(request: Request) {
  try {
    const current = await requireUser();
    if (!current) return unauthorized();

    const parsed = await parseJson(request, profileSchema);
    if ('error' in parsed) return fail(parsed.error);

    const updated = await getStore().updateUser(current.id, parsed.data);
    if (!updated) return fail('We could not find your account.', 404);

    const { passwordHash: _h, resetToken: _t, resetTokenExpiresAt: _e, ...safe } = updated;
    return ok({ user: safe });
  } catch (error) {
    return serverError(error);
  }
}

/** Plan changes are recorded locally — no payment is taken (see docs/PAYMENTS.md). */
export async function POST(request: Request) {
  try {
    const current = await requireUser();
    if (!current) return unauthorized();

    const body = (await request.json().catch(() => ({}))) as { plan?: PlanId };
    if (!body.plan || !(body.plan in PLANS)) return fail('Unknown plan.');

    const updated = await getStore().updateUser(current.id, { plan: body.plan });
    if (!updated) return fail('We could not update your plan.', 404);

    return ok({
      plan: updated.plan,
      // Honest about what happened: the plan flag changed, no money moved.
      paymentProcessed: false,
      note: 'Plan updated in your workspace. Payments are not enabled on this deployment.',
    });
  } catch (error) {
    return serverError(error);
  }
}
