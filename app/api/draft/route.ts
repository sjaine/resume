import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { validateCV, type CV } from '@/lib/cv';
import { ConflictError, getDraft, saveDraft } from '@/lib/store';

/*
 * Admin only.
 *   GET  → { cv, rev, savedAt }   the draft (a copy of the published CV until you first save)
 *   PUT  { cv, rev } → { rev, savedAt }
 *        rev is the revision you loaded; 409 + the current draft if it changed elsewhere.
 */

const noStore = { 'Cache-Control': 'no-store' };

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getDraft(), { headers: noStore });
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.rev !== 'number') return NextResponse.json({ error: 'Send { cv, rev }.' }, { status: 400 });
  const invalid = validateCV(body.cv);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const saved = await saveDraft(body.cv as CV, body.rev);
    return NextResponse.json({ rev: saved.rev, savedAt: saved.savedAt }, { headers: noStore });
  } catch (e) {
    if (e instanceof ConflictError)
      return NextResponse.json({ error: e.message, current: e.current }, { status: 409, headers: noStore });
    console.error('[draft] save failed:', e);
    return NextResponse.json({ error: 'Could not save. Try again.' }, { status: 500 });
  }
}