import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

/** Small helpers so every route returns a consistent JSON envelope. */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function serverError(error: unknown, fallback = 'Something went wrong on our side.') {
  console.error('[webora:api]', error);
  const message = error instanceof Error ? error.message : fallback;
  return fail(process.env.NODE_ENV === 'production' ? fallback : message, 500);
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>): Promise<{ data: T } | { error: string }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: 'We could not read that request.' };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    return { error: first?.message ?? 'Please check the form and try again.' };
  }
  return { data: result.data };
}

/** Best-effort client IP for rate limiting / analytics. */
export function clientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

export function detectDevice(userAgent: string | null): 'desktop' | 'tablet' | 'mobile' {
  const ua = (userAgent ?? '').toLowerCase();
  if (/ipad|tablet|kindle|playbook/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod|windows phone/.test(ua)) return 'mobile';
  return 'desktop';
}

/** Tiny in-memory rate limiter for public endpoints. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
