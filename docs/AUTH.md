# Authentication

## How it works

```
signup / login  →  bcrypt hash check  →  jose-signed JWT  →  httpOnly cookie
                                                     │
                     every server request ───────────┘
                             getCurrentUser() / requireUser()
                                       │
                                  Store.findUserById()
```

| Concern | Implementation |
| --- | --- |
| Password storage | bcrypt, 10 rounds (`bcryptjs`) |
| Session | HS256 JWT (`jose`), 30-day expiry, issued by `webora` |
| Cookie | `webora_session` — httpOnly, SameSite=Lax, `secure` in production |
| Secret | `AUTH_SECRET` (warns in production when unset) |
| Guards | `requireUser()` in route handlers, `redirect()` in server layouts |
| Validation | zod schemas in `src/lib/auth/validation.ts`, shared by every route |
| Rate limiting | in-memory buckets — 12 logins/min, 8 reset requests/min, 6 enquiries/min per IP |

The token contains only the user id, so plan changes, profile edits and deletions
take effect on the next request. Password hashes and reset tokens are stripped
from every object returned to the client.

## Password policy

Enforced in `validatePassword` and mirrored live in the signup form:

- at least 8 characters
- at least one letter
- at least one number

## Password reset

1. `POST /api/auth/reset/request` — creates a 30-minute single-use token. The
   response never reveals whether an account exists.
2. `POST /api/auth/reset/confirm` — verifies the token, replaces the hash, clears
   the token and signs the user in.

**No email provider is configured by default.** Rather than pretending an email
was sent, the API returns `delivered: false` with a `resetPath`, and the UI shows
the link in-app with a copy button and a clear explanation.

### Wiring up email

```bash
EMAIL_PROVIDER=resend        # any provider name you implement
RESEND_API_KEY=...
```

Then in `src/app/api/auth/reset/request/route.ts`, send the link instead of
returning it:

```ts
const link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
await sendMail({ to: email, subject: 'Reset your WEBORA password', text: link });
return ok({ delivered: true, message: 'Check your inbox for the reset link.' });
```

The route already branches on `process.env.EMAIL_PROVIDER`, so the response shape
and the UI need no changes.

## Swapping in Supabase Auth

The app layer keeps auth driver-agnostic on purpose. To use Supabase Auth instead:

1. Enable email/password (or magic link) in Supabase → Authentication.
2. Replace `hashPassword`/`verifyPassword` usage in the auth routes with
   `supabase.auth.signUp` / `signInWithPassword`.
3. Keep `createSessionCookie` — or drop it and let `@supabase/ssr` manage
   cookies, then implement `getCurrentUserRecord()` from `supabase.auth.getUser()`.
4. Mirror the id into `public.users` (the row already holds plan, name and
   avatar colour) with a trigger on `auth.users`, or read the profile fields from
   `user_metadata`.

Tables, foreign keys and the `Store` contract stay exactly as they are, because
`users.id` is the only join key the rest of the system uses.

## Session endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/signup` | POST | create account, start session |
| `/api/auth/login` | POST | authenticate, start session |
| `/api/auth/logout` | POST | clear the session cookie |
| `/api/auth/profile` | GET/PATCH/POST | read, update profile, change plan |
| `/api/auth/reset/request` | POST | create reset token |
| `/api/auth/reset/confirm` | POST | consume token, set new password |
