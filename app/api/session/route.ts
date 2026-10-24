import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

/*
 * GET → { admin: boolean }
 * The CV page stays static (fast, and identical for visitors and the PDF renderer);
 * the footer asks this endpoint whether the current browser is logged in.
 */
export async function GET() {
  return NextResponse.json({ admin: await isAdmin() }, { headers: { 'Cache-Control': 'no-store' } });
}