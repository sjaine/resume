import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getDraft } from '@/lib/store';
import CVDocument from '../CVDocument';

/*
 * /preview — the draft, laid out exactly like the public page. Admin only.
 * Used by /api/draft/pages to measure how many pages the draft would print to.
 */

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Draft preview', robots: { index: false, follow: false } };

export default async function Preview() {
  if (!(await isAdmin())) notFound();
  const { cv } = await getDraft();
  return (
    <main className="page">
      <CVDocument cv={cv} />
    </main>
  );
}