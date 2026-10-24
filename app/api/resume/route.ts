import { NextResponse } from 'next/server';
import { PDF_FILENAME, renderPdf } from '@/lib/pdf';
import { getPublished, versionOf } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 30;

/*
 * GET /api/resume?v=<version> → Jaine_Shin_Resume.pdf
 *
 * Rendered from the published CV and kept in memory until the next Publish.
 * The Download button sends the current version in `v`, so each published version has its own URL
 * that the CDN can keep for good. Requests without the current version are never cached by the CDN.
 */

type Rendered = { version: string; pdf: Uint8Array; pages: number };
let cached: Rendered | null = null;
let pending: { version: string; promise: Promise<Rendered> } | null = null;

async function getPdf(origin: string, version: string): Promise<Rendered> {
  if (cached?.version === version) return cached;
  if (pending?.version !== version) {
    const promise = renderPdf(`${origin}/`, bypassHeaders())
      .then(({ pdf, pages }) => {
        if (pages > 1) console.warn(`[resume] ${PDF_FILENAME} is ${pages} pages. Trim content or tighten print styles.`);
        const rendered = { version, pdf, pages };
        if (pending?.version === version) cached = rendered;
        return rendered;
      })
      .finally(() => { if (pending?.version === version) pending = null; });
    pending = { version, promise };
  }
  return pending.promise;
}

/** Lets the renderer through Vercel Deployment Protection on preview deployments. */
function bypassHeaders(): Record<string, string> {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  return secret ? { 'x-vercel-protection-bypass': secret } : {};
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const doc = await getPublished();
    const version = versionOf(doc);
    const { pdf, pages } = await getPdf(url.origin, version);
    const current = url.searchParams.get('v') === version;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${PDF_FILENAME}"`,
        'Content-Length': String(pdf.byteLength),
        'X-Resume-Pages': String(pages),
        'Access-Control-Expose-Headers': 'X-Resume-Pages',
        'Cache-Control': current
          ? 'public, max-age=3600, s-maxage=31536000, immutable' // this exact version never changes
          : 'no-store',
      },
    });
  } catch (e) {
    console.error('[resume] PDF render failed:', e);
    return NextResponse.json({ error: 'The PDF could not be prepared. Try again in a moment.' }, { status: 500 });
  }
}