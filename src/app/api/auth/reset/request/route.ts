import { getStore } from '@/lib/db';
import { randomToken } from '@/lib/auth/password';
import { resetRequestSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, rateLimit, clientIp, serverError } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * Password reset — step 1.
 *
 * WEBORA has no transactional email provider configured by default, so instead
 * of pretending an email was sent it returns the reset link directly and tells
 * the UI to display it. Wire `EMAIL_PROVIDER` + a mailer here to send it
 * instead (see docs/AUTH.md).
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, resetRequestSchema);
    if ('error' in parsed) return fail(parsed.error);

    if (!rateLimit(`reset:${clientIp(request)}`, 8, 60_000)) {
      return fail('Too many reset requests. Please try again shortly.', 429);
    }

    const { email } = parsed.data;
    const store = getStore();
    const user = await store.findUserByEmail(email);

    // Never reveal whether an account exists.
    if (!user) {
      return ok({
        delivered: false,
        message: 'If that email is registered, a reset link has been created.',
      });
    }

    const token = randomToken(24);
    const expires = new Date(Date.now() + 30 * 60_000).toISOString();
    await store.updateUser(user.id, { resetToken: token, resetTokenExpiresAt: expires });

    const emailConfigured = Boolean(process.env.EMAIL_PROVIDER);
    return ok({
      delivered: emailConfigured,
      // Shown in the UI only while no mail provider is configured.
      resetPath: emailConfigured ? undefined : `/reset-password?token=${token}`,
      expiresInMinutes: 30,
      message: emailConfigured
        ? 'Check your inbox for the reset link.'
        : 'No email provider is configured, so here is your reset link — it is valid for 30 minutes.',
    });
  } catch (error) {
    return serverError(error);
  }
}
