import { NextResponse } from 'next/server';
import { getCV } from '@/lib/cv';
import { PDF_FILENAME, renderPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

/*
 * GET /api/resume → Jaine_Shin_Resume.pdf
 *
 * Until editing exists (stage D), the CV only changes on deploy, so the PDF is rendered once
 * per server instance and cached by the CDN. Stage D6 replaces this with a file rendered on Publish.
 */

type Rendered = { version: string; pdf: Uint8Array; pages: number };
let cached: Rendered | null = null;
let pending: Promise<Rendered> | null = null;

async function getPdf(origin: string): Promise<Rendered> {
  const version = getCV().updatedAt;
  if (cached?.version === version) return cached;
  pending ??= renderPdf(`${origin}/`, bypassHeaders())
    .then(({ pdf, pages }) => {
      if (pages > 1) console.warn(`[resume] ${PDF_FILENAME} is ${pages} pages. Trim content or tighten print styles.`);
      cached = { version, pdf, pages };
      return cached;
    })
    .finally(() => { pending = null; });
  return pending;
}

/** Lets the renderer through Vercel Deployment Protection on preview deployments. */
function bypassHeaders(): Record<string, string> {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  return secret ? { 'x-vercel-protection-bypass': secret } : {};
}

export async function GET(request: Request) {
  try {
    const { pdf, pages } = await getPdf(new URL(request.url).origin);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${PDF_FILENAME}"`,
        'Content-Length': String(pdf.byteLength),
        'X-Resume-Pages': String(pages),
        'Access-Control-Expose-Headers': 'X-Resume-Pages',
        // CDN keeps it until the next deploy; browsers re-check after an hour.
        'Cache-Control': 'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    console.error('[resume] PDF render failed:', e);
    return NextResponse.json({ error: 'The PDF could not be prepared. Try again in a moment.' }, { status: 500 });
  }
}