import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/*
 * One admin, one password (ADMIN_PASSWORD env var). Same model as the Poster Wall.
 * Logging in sets an httpOnly cookie holding an HMAC signed with SESSION_SECRET + the password,
 * so changing either on Vercel logs every session out.
 */

export const COOKIE = 'cv_admin';
export const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function password() {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error('ADMIN_PASSWORD is not set');
  return s;
}

const sign = (value: string) =>
  createHmac('sha256', (process.env.SESSION_SECRET || '') + password()).update(value).digest('hex');

/** Constant-time comparison of two strings (compares their HMACs so lengths always match). */
function safeEqual(a: string, b: string) {
  return timingSafeEqual(Buffer.from(sign('cmp:' + a)), Buffer.from(sign('cmp:' + b)));
}

export const sessionToken = () => sign('cv-admin');

export const authConfigured = () => !!process.env.ADMIN_PASSWORD;

export function checkPassword(input: unknown) {
  return typeof input === 'string' && input.length > 0 && safeEqual(input, password());
}

export async function isAdmin() {
  if (!authConfigured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  return !!token && safeEqual(token, sessionToken());
}

/**
 * Guard for every write API (stage C onward):
 *   const denied = await requireAdmin(); if (denied) return denied;
 */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: 'Log in as admin first.' }, { status: 401 });
}