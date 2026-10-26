'use client';

import { useRef, useState } from 'react';

const URL_PATH = '/api/resume';
const FILENAME = 'Jaine_Shin_Resume.pdf';

type State = 'idle' | 'preparing' | 'error';

/**
 * `subtle`: outlined instead of filled, for edit mode, where Publish is the one filled button in view.
 * Either way it downloads the published PDF, the same file visitors get.
 */
export default function DownloadButton({ version, subtle = false }: { version: string; subtle?: boolean }) {
  const [state, setState] = useState<State>('idle');
  const [pages, setPages] = useState<number | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  async function download() {
    if (state === 'preparing') return;
    const btn = ref.current;
    if (btn) btn.style.minWidth = `${btn.getBoundingClientRect().width}px`; // hold the width while the label changes
    setState('preparing');
    try {
      const res = await fetch(`${URL_PATH}?v=${encodeURIComponent(version)}`);
      if (!res.ok) throw new Error(String(res.status));
      setPages(Number(res.headers.get('X-Resume-Pages')) || null);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href, download: FILENAME });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setState('idle');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    } finally {
      if (btn) btn.style.minWidth = '';
    }
  }

  const label = state === 'preparing' ? 'Preparing…' : state === 'error' ? 'Try again' : 'Download PDF';
  // A3: in development, flag a PDF that spills onto a second page. (Moves into the edit-bar in stage D.)
  const overflow = process.env.NODE_ENV === 'development' && pages !== null && pages > 1;

  return (
    <div className="download">
      <button
        ref={ref}
        type="button"
        className={`btn ${subtle ? 'btn-secondary' : 'btn-primary'} btn-sm`}
        title={subtle ? 'Downloads the published version' : undefined}
        onClick={download}
        aria-busy={state === 'preparing'}
        aria-label={state === 'idle' ? 'Download PDF' : label}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2.5v8m0 0L4.75 7.25M8 10.5l3.25-3.25M3 13.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="download-label">{label}</span>
      </button>
      <p className="download-status" role="status">
        {state === 'error' ? 'The PDF could not be prepared.' : overflow ? `PDF is ${pages} pages` : ''}
      </p>
    </div>
  );
}