import { NextResponse } from 'next/server';
import { COOKIE, MAX_AGE, authConfigured, checkPassword, sessionToken } from '@/lib/auth';

/** POST { password } → sets the admin cookie. DELETE → logs out. */
export async function POST(request: Request) {
  if (!authConfigured())
    return NextResponse.json({ error: 'ADMIN_PASSWORD is not set on the server.' }, { status: 500 });

  const { password } = await request.json().catch(() => ({}));
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}