'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useAnimationControls, useReducedMotion } from 'motion/react';
import { publishCV } from './actions';

/*
 * The footer's admin control (DESIGN.md → Components → Admin login).
 * No login page, no modal: "Admin" turns into a password pill in place.
 *   - ⌘ . (Ctrl . on Windows) opens it from anywhere.
 *   - Escape or Cancel collapses it back to "Admin".
 *   - A wrong password shakes the field once and shows the error beside it.
 * Once logged in it reads "Signed in · Publish · Log out". Stage D replaces this with the edit-bar.
 */

type Mode = 'closed' | 'open' | 'busy';

export default function AdminControl() {
  const [admin, setAdmin] = useState(false);
  const [mode, setMode] = useState<Mode>('closed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [note, setNote] = useState('Signed in');
  const inputRef = useRef<HTMLInputElement>(null);
  const adminBtnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const shake = useAnimationControls();
  const reduce = useReducedMotion();

  // Ask the server whether this browser is logged in (the page itself is static).
  useEffect(() => {
    fetch('/api/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { admin: boolean }) => setAdmin(!!d.admin))
      .catch(() => {});
  }, []);

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
    if (admin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        inputRef.current?.scrollIntoView({ block: 'nearest' });
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [admin, open]);

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
      setAdmin(true);
      setMode('closed');
      setPassword('');
      return;
    }
    const msg = res ? ((await res.json().catch(() => ({}))).error ?? 'Wrong password.') : 'Could not reach the server.';
    setError(msg);
    setMode('open');
    if (!reduce) shake.start({ x: [0, -4, 4, -3, 3, 0], transition: { duration: 0.32 } });
    requestAnimationFrame(() => inputRef.current?.select());
  }

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' }).catch(() => null);
    setAdmin(false);
    requestAnimationFrame(() => adminBtnRef.current?.focus());
  }

  async function publish() {
    setPublishing(true);
    const result = await publishCV().catch(() => ({ ok: false as const, error: 'Could not reach the server.' }));
    setPublishing(false);
    if (result.ok) {
      setNote('Published');
      router.refresh(); // show the new published version
    } else {
      setNote(result.error);
      if (result.error.startsWith('Log in')) setAdmin(false);
    }
    setTimeout(() => setNote('Signed in'), 3000);
  }

  if (admin) {
    return (
      <div className="admin">
        <span className="admin-note" role="status">{note}</span>
        {/* Stage C: publishes the draft as it is. Stage D moves this into the edit-bar. */}
        <button type="button" className="btn btn-text btn-xs" onClick={publish} disabled={publishing} aria-busy={publishing}>
          Publish
        </button>
        <button type="button" className="btn btn-text btn-xs" onClick={logout}>Log out</button>
      </div>
    );
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