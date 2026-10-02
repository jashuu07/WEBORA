import { destroySessionCookie } from '@/lib/auth/session';
import { ok, serverError } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await destroySessionCookie();
    return ok({ signedOut: true });
  } catch (error) {
    return serverError(error);
  }
}
