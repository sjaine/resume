import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getHistory, listHistory, restoreToDraft } from '@/lib/store';

/*
 * Admin only.
 *   GET            → { items: HistoryItem[] }   past published versions, newest first
 *   GET ?id=…      → { cv, rev, savedAt }        one version, for previewing
 *   POST { id }    → { rev, savedAt }           puts that version back into the draft
 */

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ items: await listHistory() }, { headers: noStore });

  const doc = await getHistory(id);
  if (!doc) return NextResponse.json({ error: 'That version no longer exists.' }, { status: 404 });
  return NextResponse.json(doc, { headers: noStore });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== 'string') return NextResponse.json({ error: 'Send { id }.' }, { status: 400 });
  try {
    const draft = await restoreToDraft(id);
    if (!draft) return NextResponse.json({ error: 'That version no longer exists.' }, { status: 404 });
    return NextResponse.json({ rev: draft.rev, savedAt: draft.savedAt }, { headers: noStore });
  } catch (e) {
    console.error('[history] restore failed:', e);
    return NextResponse.json({ error: 'Could not restore. Try again.' }, { status: 500 });
  }
}