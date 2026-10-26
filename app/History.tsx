'use client';

import { useEffect, useRef, useState } from 'react';
import type { HistoryItem } from '@/lib/store';

/*
 * G3: the list of past published versions, opened from the edit-bar.
 * Picking one shows it read-only on the page; CVApp then offers "Restore to draft".
 */

/** "Oct 27, 12:30 AM" in the viewer's time zone. The version from before history existed has no time. */
export function whenPublished(iso: string) {
  const t = Date.parse(iso);
  if (!t) return 'Original version';
  return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

type Props = {
  liveId: string;
  onPick: (item: HistoryItem) => void;
  onClose: () => void;
};

export default function HistoryPanel({ liveId, onPick, onClose }: Props) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/history', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { items: HistoryItem[] }) => setItems(d.items))
      .catch(() => setError('Could not load history.'));
  }, []);

  // Close on Escape or a click outside (the History button itself toggles).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest('[data-history-toggle]')) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [onClose]);

  useEffect(() => {
    if (items?.length) ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [items]);

  return (
    <div className="history" ref={ref} role="dialog" aria-label="Published versions">
      <p className="history-title">Published versions</p>
      {error ? <p className="history-empty is-error">{error}</p>
        : !items ? <p className="history-empty">Loading…</p>
        : !items.length ? <p className="history-empty">Nothing yet. Every Publish is kept here (the last 20).</p>
        : (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onPick(item)}>
                  <span className="history-when">{whenPublished(item.publishedAt)}</span>
                  <span className="history-meta">{item.role} · {item.entries} entries</span>
                  {item.id === liveId && <span className="status-pill">LIVE</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}