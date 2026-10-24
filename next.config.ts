import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Headless Chrome for /api/resume: keep it out of the bundle and ship its binary with the function.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  outputFileTracingIncludes: {
    '/api/resume': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;