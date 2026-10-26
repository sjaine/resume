'use client';

import { createElement, useEffect, useLayoutEffect, useRef } from 'react';

/*
 * One editable piece of text (DESIGN.md → Components → Edit mode).
 * Plain text only, edited in place, so the page never changes layout between reading and editing.
 *
 * The element is uncontrolled while focused: React doesn't rewrite its text on every keystroke,
 * which keeps the caret where you are typing. The value is re-synced when the field isn't focused.
 */

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  as?: 'span' | 'div';
  className?: string;
  /** Enter inserts a line break instead of finishing the field. */
  multiline?: boolean;
  maxLength?: number;
};

const NBSP = new RegExp(String.fromCharCode(160), 'g'); // non-breaking spaces from paste

export default function Field({ value, onChange, placeholder, as = 'span', className, multiline, maxLength }: Props) {
  const ref = useRef<HTMLElement>(null);
  const latest = useRef(value);
  latest.current = value;

  /** Same rules while typing and when leaving the field: no line breaks (unless multiline), within maxLength. */
  const normalise = (raw: string) => {
    let text = raw.replace(NBSP, ' ');
    if (!multiline) text = text.replace(/\s*\n\s*/g, ' ');
    return maxLength ? text.slice(0, maxLength) : text;
  };

  // Like <input maxLength>: typing stops at the limit. (The native event: React's onBeforeInput
  // is a polyfill without inputType.) A paste over the limit is cut by normalise.
  useEffect(() => {
    const el = ref.current;
    if (!el || !maxLength) return;
    const onBeforeInput = (e: InputEvent) => {
      if (!e.inputType.startsWith('insert')) return;
      const sel = window.getSelection();
      const replacing = sel && !sel.isCollapsed && el.contains(sel.anchorNode) ? sel.toString().length : 0;
      if ((el.textContent ?? '').length - replacing >= maxLength) e.preventDefault();
    };
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, [maxLength]);

  // Keep the DOM in step with the value, except while the caret is inside the field.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);

  return createElement(as, {
    ref,
    className: ['editable', className].filter(Boolean).join(' '),
    contentEditable: 'plaintext-only',
    suppressContentEditableWarning: true,
    role: 'textbox',
    'aria-label': placeholder,
    'aria-multiline': multiline || undefined,
    'data-placeholder': placeholder,
    spellCheck: true,
    onInput: (e: React.FormEvent<HTMLElement>) => onChange(normalise(e.currentTarget.textContent ?? '')),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if ((e.key === 'Enter' && !multiline) || e.key === 'Escape') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      // Tidy up (trim, limit), then show the stored value (e.g. "a,b" → "a, b" for skills).
      const tidy = normalise(e.currentTarget.textContent ?? '').trim();
      if (tidy !== value) onChange(tidy);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el && document.activeElement !== el && el.textContent !== latest.current) el.textContent = latest.current;
      });
    },
  });
}