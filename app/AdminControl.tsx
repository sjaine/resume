'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'motion/react';

/*
 * The footer's "Admin" login (DESIGN.md → Components → Admin login).
 * No login page, no modal: "Admin" turns into a password pill in place.
 *   - ⌘ . (Ctrl . on Windows) opens it from anywhere.
 *   - Escape or Cancel collapses it back to "Admin".
 *   - A wrong password shakes the field once and shows the error beside it.
 * Once logged in, CVApp switches the page to Edit mode and shows the edit-bar.
 */

type Mode = 'closed' | 'open' | 'busy';

export default function AdminControl({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>('closed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const adminBtnRef = useRef<HTMLButtonElement>(null);
  const shake = useAnimationControls();
  const reduce = useReducedMotion();

  const open = useCallback(() => {
    setError('');
    setMode('open');
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setMode('closed');
    setPassword('');
    setError('');
    requestAnimationFrame(() => adminBtnRef.current?.focus());
  }, []);

  // ⌘ . / Ctrl . opens the login from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        inputRef.current?.scrollIntoView({ block: 'nearest' });
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!password || mode === 'busy') return;
    setMode('busy');
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null);

    if (res?.ok) {
      setMode('closed');
      setPassword('');
      onLogin();
      return;
    }
    const msg = res ? ((await res.json().catch(() => ({}))).error ?? 'Wrong password.') : 'Could not reach the server.';
    setError(msg);
    setMode('open');
    if (!reduce) shake.start({ x: [0, -4, 4, -3, 3, 0], transition: { duration: 0.32 } });
    requestAnimationFrame(() => inputRef.current?.select());
  }

  if (mode === 'closed') {
    return (
      <div className="admin">
        <button ref={adminBtnRef} type="button" className="btn btn-text btn-xs" onClick={open}
          aria-keyshortcuts="Meta+Period Control+Period">
          Admin
        </button>
      </div>
    );
  }

  return (
    <form className="admin login" onSubmit={login} onKeyDown={(e) => e.key === 'Escape' && close()}>
      {error && <span className="login-error" role="alert">{error}</span>}
      {/* lets password managers (iCloud Keychain, 1Password) save and fill this login */}
      <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />
      <motion.input
        ref={inputRef}
        animate={shake}
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Admin password"
        aria-label="Admin password"
        aria-invalid={!!error}
        value={password}
        onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
        disabled={mode === 'busy'}
      />
      <button type="submit" className="btn btn-primary btn-xs" disabled={!password || mode === 'busy'}
        aria-busy={mode === 'busy'}>
        Log in
      </button>
      <button type="button" className="btn btn-text btn-xs" onClick={close}>Cancel</button>
    </form>
  );
}