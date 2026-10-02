import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { User } from '@/types';
import { getStore } from '@/lib/db';

/**
 * Session handling — signed, httpOnly, SameSite=Lax JWT cookie.
 *
 * The token holds only the user id; everything else is read from the store on
 * each request, so plan changes and deletions take effect immediately.
 */

export const SESSION_COOKIE = 'webora_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? '';
  if (!secret || secret === 'change-me-to-a-long-random-string') {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[webora:auth] AUTH_SECRET is not set. Set it in your environment before going live (see .env.example).',
      );
    }
    return new TextEncoder().encode('webora-insecure-development-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string, email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer('webora')
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: 'webora' });
    if (!payload.sub) return null;
    return { userId: payload.sub, email: String(payload.email ?? '') };
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string, email: string) {
  const token = await signSession(userId, email);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Current user (full record) for server components and route handlers. */
export async function getCurrentUserRecord() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  if (!session) return null;
  return getStore().findUserById(session.userId);
}

/** Public-safe user projection (never includes the password hash). */
export async function getCurrentUser(): Promise<User | null> {
  const record = await getCurrentUserRecord();
  if (!record) return null;
  const { passwordHash: _hash, resetToken: _rt, resetTokenExpiresAt: _rte, ...safe } = record;
  return safe;
}

/** Route-handler guard: returns the user or null. */
export async function requireUser() {
  const record = await getCurrentUserRecord();
  if (!record) return null;
  const { passwordHash: _hash, resetToken: _rt, resetTokenExpiresAt: _rte, ...safe } = record;
  return safe;
}

export function unauthorized() {
  return Response.json({ error: 'You need to sign in to do that.' }, { status: 401 });
}
