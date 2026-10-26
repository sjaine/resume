import { NextResponse } from 'next/server';
import { COOKIE, requireAdmin } from '@/lib/auth';
import { renderPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

/*
 * GET → { pages }  How many pages the current draft prints to. Admin only.
 * Renders /preview with the same headless Chrome as the real PDF, passing the admin cookie along.
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const session = request.headers.get('cookie')?.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))?.[1];
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  try {
    const { pages } = await renderPdf(
      `${url.origin}/preview`,
      secret ? { 'x-vercel-protection-bypass': secret } : {},
      session ? [{ name: COOKIE, value: session }] : [],
    );
    return NextResponse.json({ pages }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[pages] could not measure the draft:', e);
    return NextResponse.json({ error: 'Could not measure the draft.' }, { status: 500 });
  }
}