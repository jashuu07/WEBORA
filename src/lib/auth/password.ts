import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Password policy shown to the user in the UI. */
export function validatePassword(password: string): { ok: boolean; message?: string } {
  if (password.length < 8) return { ok: false, message: 'Use at least 8 characters.' };
  if (!/[a-zA-Z]/.test(password)) return { ok: false, message: 'Include at least one letter.' };
  if (!/[0-9]/.test(password)) return { ok: false, message: 'Include at least one number.' };
  return { ok: true };
}
