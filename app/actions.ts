'use server';

import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { publish } from '@/lib/store';

/*
 * Publish: copies the draft to the published CV and refreshes the public page.
 * A Server Action (not a route) because revalidatePath here updates the page immediately,
 * so the very next visit — and the PDF renderer — sees the new version.
 */
export async function publishCV(): Promise<{ ok: true; rev: number; updatedAt: string } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Log in as admin first.' };
  try {
    const doc = await publish();
    revalidatePath('/');
    return { ok: true, rev: doc.rev, updatedAt: doc.cv.updatedAt };
  } catch (e) {
    console.error('[publish] failed:', e);
    return { ok: false, error: 'Could not publish. Try again.' };
  }
}