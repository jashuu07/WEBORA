import { getStore } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';
import { resetConfirmSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, resetConfirmSchema);
    if ('error' in parsed) return fail(parsed.error);

    const { token, password } = parsed.data;
    const policy = validatePassword(password);
    if (!policy.ok) return fail(policy.message!);

    const store = getStore();
    const user = await store.findUserByResetToken(token);
    if (!user) return fail('This reset link is invalid or has expired. Request a new one.', 400);

    await store.updateUser(user.id, {
      passwordHash: await hashPassword(password),
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
    });

    await createSessionCookie(user.id, user.email);
    return ok({ reset: true, email: user.email });
  } catch (error) {
    return serverError(error);
  }
}
