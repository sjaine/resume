import 'server-only';
import type { Browser } from 'puppeteer-core';

/*
 * Renders the CV page to a PDF with headless Chrome, using the page's own print styles
 * (app/globals.css → @media print). The web page and the PDF are one document.
 *
 * - On Vercel: @sparticuz/chromium (a Chromium build small enough for a serverless function).
 * - Locally: your installed Chrome. Set CHROME_PATH in .env.local if it isn't found.
 */

export const PDF_FILENAME = 'Jaine_Shin_Resume.pdf';

const LOCAL_CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean) as string[];

async function launch(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const { existsSync } = await import('node:fs');
  const executablePath = LOCAL_CHROME.find((p) => existsSync(p));
  if (!executablePath) throw new Error('Chrome not found. Set CHROME_PATH in .env.local to your Chrome binary.');
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
}

/** Counts pages in a PDF Chrome produced (each page is a `/Type /Page` object). */
export function countPages(pdf: Uint8Array) {
  const text = Buffer.from(pdf).toString('latin1');
  return (text.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

/** Renders `url` in print mode and returns the PDF bytes and page count. */
/**
 * Renders `url` in print mode and returns the PDF bytes and page count.
 * `cookies` are set for that URL first (the draft preview needs the admin session).
 */
export async function renderPdf(
  url: string,
  headers: Record<string, string> = {},
  cookies: { name: string; value: string }[] = [],
) {
  const browser = await launch();
  try {
    const { hostname } = new URL(url);
    if (cookies.length) await browser.setCookie(...cookies.map((c) => ({ ...c, domain: hostname, path: '/' })));
    const page = await browser.newPage();
    if (Object.keys(headers).length) await page.setExtraHTTPHeaders(headers);
    await page.emulateMediaType('print');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      preferCSSPageSize: true, // size and margins come from @page in globals.css
      printBackground: true,
      tagged: true, // accessible, text-selectable PDF (also what applicant tracking systems read)
    });
    return { pdf, pages: countPages(pdf) };
  } finally {
    await browser.close();
  }
}