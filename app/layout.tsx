import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { getPublished } from '@/lib/store';
import './globals.css';

/*
 * Self-hosted Geist, static weights only (400 + 500, the two DESIGN.md uses).
 * Static files, not the variable font: Chrome embeds variable fonts in PDFs as Type 3 glyphs,
 * which some applicant tracking systems read poorly. Static fonts embed as real text fonts.
 */
const sans = localFont({
  variable: '--font-geist-sans',
  display: 'swap',
  src: [
    { path: './fonts/Geist-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Geist-Medium.woff2', weight: '500', style: 'normal' },
  ],
});
const mono = localFont({
  variable: '--font-geist-mono',
  display: 'swap',
  src: [{ path: './fonts/GeistMono-Regular.woff2', weight: '400', style: 'normal' }],
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = (await getPublished()).cv;
  return {
    title: 'Jaine_Shin_Resume',
    description: `${profile.role} · ${profile.location}`,
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
