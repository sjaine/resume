"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUpdated, type CV } from "@/lib/cv";
import { publishCV } from "./actions";
import CVDocument from "./CVDocument";
import DownloadButton from "./DownloadButton";
import AdminControl from "./AdminControl";
import HistoryPanel, { whenPublished } from "./History";
import type { HistoryItem } from "@/lib/store";

/*
 * The page in its three states (DESIGN.md → Overview):
 *   Read  — visitors: the published CV, Download PDF, and "Admin" in the footer.
 *   Edit  — after logging in: the draft, editable in place, autosaved, with the edit-bar at the bottom.
 *   (Tailor arrives in stage F.)
 * The server renders Read mode, so visitors and the PDF renderer never wait for JavaScript.
 */

type Props = {
  published: CV;
  publishedRev: number;
  publishedAt: string;
  version: string;
};
type Save = "idle" | "unsaved" | "saving" | "saved" | "error" | "conflict";

const AUTOSAVE_MS = 1000;
const PAGE_CHECK_MS = 2500;

export default function CVApp({
  published,
  publishedRev,
  publishedAt,
  version,
}: Props) {
  const router = useRouter();
  const [admin, setAdmin] = useState(false);
  const [draft, setDraft] = useState<CV | null>(null);
  const [save, setSave] = useState<Save>("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [note, setNote] = useState("");
  const [pages, setPages] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewing, setViewing] = useState<{ item: HistoryItem; cv: CV } | null>(
    null
  );
  const [restoring, setRestoring] = useState(false);

  // Refs hold the latest values for the save loop, which runs outside React's render cycle.
  const cvRef = useRef<CV | null>(null);
  const revRef = useRef(0);
  const dirty = useRef(false);
  const inflight = useRef<Promise<void> | null>(null);
  const conflict = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ---------- session + draft ----------

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { admin: boolean }) => setAdmin(!!d.admin))
      .catch(() => {});
  }, []);

  const loadDraft = useCallback(async () => {
    const res = await fetch("/api/draft", { cache: "no-store" }).catch(
      () => null
    );
    if (res?.status === 401) {
      setAdmin(false);
      return;
    }
    if (!res?.ok) {
      setSave("error");
      setError("Could not load the draft.");
      return;
    }
    const doc = (await res.json()) as { cv: CV; rev: number };
    cvRef.current = doc.cv;
    revRef.current = doc.rev;
    dirty.current = false;
    conflict.current = false;
    setDraft(doc.cv);
    setSave("idle");
    setError("");
  }, []);

  useEffect(() => {
    if (admin) loadDraft();
    else {
      setDraft(null);
      cvRef.current = null;
    }
  }, [admin, loadDraft]);

  // ---------- D7: page count of the draft as a PDF ----------

  const checkPages = useCallback(() => {
    clearTimeout(pageTimer.current);
    pageTimer.current = setTimeout(async () => {
      const res = await fetch("/api/draft/pages", { cache: "no-store" }).catch(
        () => null
      );
      if (res?.ok) setPages(((await res.json()) as { pages: number }).pages);
    }, PAGE_CHECK_MS);
  }, []);

  useEffect(() => {
    if (draft && pages === null) checkPages();
  }, [draft, pages, checkPages]);

  // ---------- D7: autosave ----------

  const flush = useCallback(async (): Promise<void> => {
    clearTimeout(timer.current);
    if (inflight.current) {
      await inflight.current;
      return dirty.current ? flush() : undefined;
    }
    if (!dirty.current || !cvRef.current || conflict.current) return;

    dirty.current = false;
    setSave("saving");
    const body = JSON.stringify({ cv: cvRef.current, rev: revRef.current });
    inflight.current = (async () => {
      const res = await fetch("/api/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};

      if (res?.ok) {
        revRef.current = data.rev;
        setSave(dirty.current ? "unsaved" : "saved");
        setError("");
        checkPages();
      } else if (res?.status === 409) {
        conflict.current = true; // stop saving until the newer draft is reloaded
        setSave("conflict");
        setError("Changed in another tab.");
      } else if (res?.status === 401) {
        dirty.current = true;
        setAdmin(false);
      } else {
        dirty.current = true; // keep the change so the next edit or ⌘S retries it
        setSave("error");
        setError(data.error ?? "Could not reach the server.");
      }
    })();
    await inflight.current;
    inflight.current = null;
    if (dirty.current && !conflict.current)
      timer.current = setTimeout(flush, AUTOSAVE_MS);
  }, [checkPages]);

  const update = useCallback(
    (change: (cv: CV) => void) => {
      if (!cvRef.current) return;
      const next = structuredClone(cvRef.current);
      change(next);
      cvRef.current = next;
      dirty.current = true;
      setDraft(next);
      setSave("unsaved");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
    [flush]
  );

  // ⌘S saves now; leaving the page sends whatever is unsaved.
  useEffect(() => {
    if (!admin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush();
      }
    };
    const onLeave = () => {
      if (!dirty.current || !cvRef.current || conflict.current) return;
      fetch("/api/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvRef.current, rev: revRef.current }),
        keepalive: true,
      });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [admin, flush]);

  // ---------- publish / log out ----------

  async function publish() {
    setPublishing(true);
    await flush();
    if (dirty.current) {
      setPublishing(false);
      return;
    } // the save failed; the bar already says why
    const result = await publishCV().catch(() => ({
      ok: false as const,
      error: "Could not reach the server.",
    }));
    setPublishing(false);
    if (result.ok) {
      setNote("Published");
      setTimeout(() => setNote(""), 2500);
      router.refresh(); // the server re-renders Read mode with the new published CV
    } else {
      setNote(result.error);
      if (result.error.startsWith("Log in")) setAdmin(false);
    }
  }

  // ---------- G3: history ----------

  async function view(item: HistoryItem) {
    setHistoryOpen(false);
    const res = await fetch(`/api/history?id=${encodeURIComponent(item.id)}`, {
      cache: "no-store",
    }).catch(() => null);
    if (!res?.ok) {
      setNote("Could not open that version.");
      setTimeout(() => setNote(""), 2500);
      return;
    }
    setViewing({ item, cv: ((await res.json()) as { cv: CV }).cv });
    window.scrollTo({ top: 0 });
  }

  async function restore() {
    if (!viewing) return;
    setRestoring(true);
    await flush(); // don't lose an edit that was still waiting to save
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: viewing.item.id }),
    }).catch(() => null);
    setRestoring(false);
    if (!res?.ok) {
      setNote("Could not restore. Try again.");
      setTimeout(() => setNote(""), 2500);
      return;
    }
    setViewing(null);
    setPreview(false);
    await loadDraft();
    checkPages();
    setNote("Restored. Publish to make it live.");
    setTimeout(() => setNote(""), 4000);
  }

  async function logout() {
    await flush();
    await fetch("/api/login", { method: "DELETE" }).catch(() => null);
    setAdmin(false);
    setPreview(false);
    setViewing(null);
    setHistoryOpen(false);
  }

  // ---------- render ----------

  const editing = admin && !!draft && !preview && !viewing;
  const shown = viewing ? viewing.cv : admin && draft ? draft : published;
  const liveId = `${Date.parse(publishedAt)
    .toString()
    .padStart(13, "0")}-${publishedRev}`;
  const isPublished =
    admin &&
    save !== "unsaved" &&
    save !== "saving" &&
    !dirty.current &&
    revRef.current === publishedRev;

  return (
    <>
      <DownloadButton version={version} subtle={admin} />

      <main className={`page${editing ? " editing" : ""}`}>
        <CVDocument cv={shown} edit={editing ? { update } : undefined} />

        <footer className="cv-footer">
          <span>
            Last updated{" "}
            <time className="data" dateTime={published.updatedAt}>
              {formatUpdated(published.updatedAt)}
            </time>
          </span>
          {!admin && <AdminControl onLogin={() => setAdmin(true)} />}
        </footer>
      </main>

      {admin && historyOpen && !viewing && (
        <HistoryPanel
          liveId={liveId}
          onPick={view}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {admin && viewing && (
        <div
          className="edit-bar is-viewing"
          role="toolbar"
          aria-label="Viewing a past version"
        >
          <span className="status-pill is-draft">
            {viewing.item.id === liveId ? "LIVE" : "PAST VERSION"}
          </span>
          <span className="edit-note">
            {whenPublished(viewing.item.publishedAt)}
          </span>
          <span className="edit-spacer" />
          <button
            type="button"
            className="btn btn-text btn-xs"
            onClick={() => {
              setViewing(null);
              setHistoryOpen(true);
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={restore}
            disabled={restoring}
            aria-busy={restoring}
          >
            Restore to draft
          </button>
        </div>
      )}

      {admin && !viewing && (
        <div className="edit-bar" role="toolbar" aria-label="Editor">
          <span className={`status-pill${isPublished ? "" : " is-draft"}`}>
            {isPublished ? "PUBLISHED" : "DRAFT"}
          </span>
          <span
            className={`edit-note${
              save === "error" ||
              save === "conflict" ||
              note.startsWith("Could")
                ? " is-error"
                : ""
            }`}
            role="status"
          >
            {!draft
              ? "Loading…"
              : note
              ? note
              : save === "saving"
              ? "Saving…"
              : save === "saved"
              ? "Saved"
              : save === "unsaved"
              ? "Edited"
              : error}
          </span>
          {save === "conflict" && (
            <button
              type="button"
              className="btn btn-text btn-xs"
              onClick={loadDraft}
            >
              Reload
            </button>
          )}
          {pages !== null && pages > 1 && (
            <span
              className="edit-warn"
              title="The downloadable PDF should fit on one page"
            >
              PDF {pages} pages
            </span>
          )}
          <span className="edit-spacer" />
          <button
            type="button"
            className="btn btn-text btn-xs"
            data-history-toggle
            onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen}
            disabled={!draft}
          >
            History
          </button>
          <button
            type="button"
            className="btn btn-text btn-xs"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            disabled={!draft}
          >
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            type="button"
            className="btn btn-text btn-xs"
            onClick={logout}
          >
            Log out
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={publish}
            disabled={!draft || publishing || save === "conflict"}
            aria-busy={publishing}
          >
            Publish
          </button>
        </div>
      )}
    </>
  );
}
