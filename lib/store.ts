import 'server-only';
import { del, get, put } from '@vercel/blob';
import seed from '@/data/cv.json';
import type { CV } from './cv';

/*
 * Documents:
 *   draft            saved while editing (autosave)
 *   published        replaced only when you press Publish
 *   history/index    the list of past published versions (newest first, at most HISTORY_MAX)
 *   history/<id>     one past published version
 *
 * Where they live:
 *   - BLOB_READ_WRITE_TOKEN set (Vercel): private Vercel Blob, under cv/ (e.g. cv/draft.json).
 *   - Otherwise (local dev): the .data folder (e.g. .data/draft.json), created from data/cv.json.
 *
 * Every draft save carries the revision it was based on. If the stored draft has moved on
 * (another tab saved first), the save is refused instead of silently overwriting it.
 */

export type DocName = 'draft' | 'published';
export type CVDoc = { cv: CV; rev: number; savedAt: string };

/** One past published version, as listed in History. */
export type HistoryItem = { id: string; publishedAt: string; role: string; entries: number };

export const HISTORY_MAX = 20;
const HISTORY_ID = /^\d{13}-\d{1,9}$/;

export class ConflictError extends Error {
  constructor(public current: CVDoc) {
    super('The draft changed somewhere else. Reload to get the latest version.');
  }
}

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const seedDoc = (): CVDoc => ({ cv: structuredClone(seed) as CV, rev: 0, savedAt: new Date(0).toISOString() });

// ---------- backends: JSON documents by key ("draft", "history/index", …) ----------

const blobPath = (key: string) => `cv/${key}.json`;

async function readBlob<T>(key: string): Promise<T | null> {
  const res = await get(blobPath(key), { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text()) as T;
}

async function writeBlob(key: string, value: unknown) {
  await put(blobPath(key), JSON.stringify(value), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function fileApi() {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const root = path.join(process.cwd(), '.data');
  const file = (key: string) => path.join(root, `${key}.json`);
  return {
    async read<T>(key: string): Promise<T | null> {
      try {
        return JSON.parse(await fs.readFile(file(key), 'utf8')) as T;
      } catch {
        return null;
      }
    },
    async write(key: string, value: unknown) {
      await fs.mkdir(path.dirname(file(key)), { recursive: true });
      const tmp = `${file(key)}.${process.pid}-${Math.random().toString(36).slice(2)}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(value, null, 2) + '\n');
      await fs.rename(tmp, file(key)); // atomic replace
    },
    /** Creates the file only if it doesn't exist yet (safe when two requests seed at once). */
    async create(key: string, value: unknown) {
      await fs.mkdir(path.dirname(file(key)), { recursive: true });
      await fs.writeFile(file(key), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }).catch((e) => {
        if (e.code !== 'EEXIST') throw e;
      });
    },
    async remove(keys: string[]) {
      await Promise.all(keys.map((k) => fs.rm(file(k), { force: true })));
    },
  };
}

async function readKey<T>(key: string): Promise<T | null> {
  return useBlob() ? readBlob<T>(key) : (await fileApi()).read<T>(key);
}
async function writeKey(key: string, value: unknown) {
  return useBlob() ? writeBlob(key, value) : (await fileApi()).write(key, value);
}
async function removeKeys(keys: string[]) {
  if (!keys.length) return;
  return useBlob() ? del(keys.map(blobPath)) : (await fileApi()).remove(keys);
}

/** Reads draft/published. Locally, a missing file is created from data/cv.json so it can be edited by hand. */
async function readDoc(name: DocName): Promise<CVDoc | null> {
  if (useBlob()) return readBlob<CVDoc>(name);
  const files = await fileApi();
  const found = await files.read<CVDoc>(name);
  if (found) return found;
  await files.create(name, seedDoc());
  return files.read<CVDoc>(name);
}

// ---------- draft + published ----------

/** Changes on every Publish; used to version the PDF URL. */
export const versionOf = (doc: CVDoc) => `${doc.rev}-${Date.parse(doc.savedAt).toString(36)}`;

/** What visitors, the PDF and search engines see. Falls back to data/cv.json before the first publish. */
export async function getPublished(): Promise<CVDoc> {
  try {
    return (await readDoc('published')) ?? seedDoc();
  } catch (e) {
    console.error('[store] Could not read the published CV, showing data/cv.json:', e);
    return seedDoc();
  }
}

/** What the editor works on. Starts as a copy of the published CV. */
export async function getDraft(): Promise<CVDoc> {
  return (await readDoc('draft')) ?? (await getPublished());
}

/** Saves the draft. `baseRev` is the revision the editor last loaded; a mismatch throws ConflictError. */
export async function saveDraft(cv: CV, baseRev: number): Promise<CVDoc> {
  const current = (await readDoc('draft')) ?? (await getPublished());
  if (current.rev !== baseRev) throw new ConflictError(current);

  // The rev check above is the guard against overwriting another tab's save.
  // (Blob's ifMatch isn't used: the etag a read returns doesn't match the one a write compares against.)
  const next: CVDoc = { cv, rev: current.rev + 1, savedAt: new Date().toISOString() };
  await writeKey('draft', next);
  return next;
}

/**
 * Copies the draft to published, stamps "Last updated" with today's date in Toronto,
 * and keeps the new version in History. The very first time, the version that was live
 * before is kept too, so there is always something to go back to.
 */
export async function publish(): Promise<CVDoc> {
  const [draft, before, index] = await Promise.all([getDraft(), getPublished(), listHistory()]);
  const published: CVDoc = {
    cv: { ...draft.cv, updatedAt: todayInToronto() },
    rev: draft.rev,
    savedAt: new Date().toISOString(),
  };
  await writeKey('published', published);

  const snapshots = index.length ? [published] : [published, before];
  await addToHistory(snapshots, index).catch((e) => console.error('[history] could not keep this version:', e));
  return published;
}

function todayInToronto() {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
}

// ---------- G3: history ----------

const historyId = (doc: CVDoc) => `${Date.parse(doc.savedAt).toString().padStart(13, '0')}-${doc.rev}`;
const describe = (doc: CVDoc): HistoryItem => ({
  id: historyId(doc),
  publishedAt: doc.savedAt,
  role: doc.cv.profile.role,
  entries: doc.cv.sections.reduce((n, s) => n + (s.entries?.length ?? 0), 0),
});

/** Past published versions, newest first. */
export async function listHistory(): Promise<HistoryItem[]> {
  return (await readKey<HistoryItem[]>('history/index')) ?? [];
}

/** One past version, or null if the id is unknown. */
export async function getHistory(id: string): Promise<CVDoc | null> {
  if (!HISTORY_ID.test(id)) return null;
  return readKey<CVDoc>(`history/${id}`);
}

async function addToHistory(docs: CVDoc[], index: HistoryItem[]) {
  await Promise.all(docs.map((d) => writeKey(`history/${historyId(d)}`, d)));
  const known = new Set(index.map((i) => i.id));
  const next = [...docs.map(describe).filter((i) => !known.has(i.id)), ...index]
    .sort((a, b) => b.id.localeCompare(a.id));
  await writeKey('history/index', next.slice(0, HISTORY_MAX));
  await removeKeys(next.slice(HISTORY_MAX).map((i) => `history/${i.id}`));
}

/**
 * Puts a past version back into the draft (not live until you Publish).
 * Uses the stored draft's current revision, so it never trips the conflict check.
 */
export async function restoreToDraft(id: string): Promise<CVDoc | null> {
  const past = await getHistory(id);
  if (!past) return null;
  const current = await getDraft();
  return saveDraft(past.cv, current.rev);
}