import { getStore } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';
import { signupSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';
import type { UserRecord } from '@/types';

export const runtime = 'nodejs';

const AVATAR_COLORS = ['#F26A1B', '#0F766E', '#7C3AED', '#B4552D', '#1D4ED8', '#B91C1C'];

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, signupSchema);
    if ('error' in parsed) return fail(parsed.error);

    const { name, email, password, company } = parsed.data;
    const policy = validatePassword(password);
    if (!policy.ok) return fail(policy.message!);

    const store = getStore();
    const existing = await store.findUserByEmail(email);
    if (existing) return fail('An account with this email already exists. Try signing in.', 409);

    const record: UserRecord = {
      id: `usr_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
      email,
      name,
      plan: 'free',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      company: company || undefined,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    await store.createUser(record);
    await createSessionCookie(record.id, record.email);

    const { passwordHash: _h, ...safe } = record;
    return ok({ user: safe }, { status: 201 });
  } catch (error) {
    return serverError(error, 'We could not create your account. Please try again.');
  }
}
