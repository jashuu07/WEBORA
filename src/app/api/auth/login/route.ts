import { getStore } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';
import { loginSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, rateLimit, clientIp, serverError } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, loginSchema);
    if ('error' in parsed) return fail(parsed.error);

    if (!rateLimit(`login:${clientIp(request)}`, 12, 60_000)) {
      return fail('Too many attempts. Please wait a minute and try again.', 429);
    }

    const { email, password } = parsed.data;
    const store = getStore();
    const user = await store.findUserByEmail(email);

    // Same message for "no such user" and "wrong password" — no account probing.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail('Email or password is incorrect.', 401);
    }

    await createSessionCookie(user.id, user.email);
    const { passwordHash: _h, resetToken: _t, resetTokenExpiresAt: _e, ...safe } = user;
    return ok({ user: safe });
  } catch (error) {
    return serverError(error, 'We could not sign you in. Please try again.');
  }
}
