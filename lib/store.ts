import "server-only";
import { get, put } from "@vercel/blob";
import seed from "@/data/cv.json";
import type { CV } from "./cv";

/*
 * Two documents: the draft you edit and the published copy visitors see.
 *
 *   draft      saved while editing (stage D autosaves here)
 *   published  replaced only when you press Publish
 *
 * Where they live:
 *   - BLOB_READ_WRITE_TOKEN set (Vercel): private Vercel Blob, cv/draft.json and cv/published.json.
 *   - Otherwise (local dev): .data/draft.json and .data/published.json, created from data/cv.json.
 *
 * Every save carries the revision it was based on. If the stored draft has moved on
 * (another tab saved first), the save is refused instead of silently overwriting it.
 */

export type DocName = "draft" | "published";
export type CVDoc = { cv: CV; rev: number; savedAt: string };

export class ConflictError extends Error {
  constructor(public current: CVDoc) {
    super(
      "The draft changed somewhere else. Reload to get the latest version."
    );
  }
}

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const seedDoc = (): CVDoc => ({
  cv: structuredClone(seed) as CV,
  rev: 0,
  savedAt: new Date(0).toISOString(),
});

// ---------- backends ----------

type Stored = { doc: CVDoc } | null;

const blobPath = (name: DocName) => `cv/${name}.json`;

async function readBlob(name: DocName): Promise<Stored> {
  const res = await get(blobPath(name), { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  const text = await new Response(res.stream).text();
  return { doc: JSON.parse(text) as CVDoc };
}

async function writeBlob(name: DocName, doc: CVDoc) {
  await put(blobPath(name), JSON.stringify(doc), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function fileApi() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), ".data");
  const file = (name: DocName) => path.join(dir, `${name}.json`);
  return {
    async read(name: DocName): Promise<Stored> {
      try {
        return {
          doc: JSON.parse(await fs.readFile(file(name), "utf8")) as CVDoc,
        };
      } catch {
        return null;
      }
    },
    async write(name: DocName, doc: CVDoc) {
      await fs.mkdir(dir, { recursive: true });
      const tmp = `${file(name)}.${process.pid}-${Math.random()
        .toString(36)
        .slice(2)}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(doc, null, 2) + "\n");
      await fs.rename(tmp, file(name)); // atomic replace
    },
    /** Creates the file only if it doesn't exist yet (safe when two requests seed at once). */
    async create(name: DocName, doc: CVDoc) {
      await fs.mkdir(dir, { recursive: true });
      await fs
        .writeFile(file(name), JSON.stringify(doc, null, 2) + "\n", {
          flag: "wx",
        })
        .catch((e) => {
          if (e.code !== "EEXIST") throw e;
        });
    },
  };
}

async function read(name: DocName): Promise<Stored> {
  if (useBlob()) return readBlob(name);
  const files = await fileApi();
  const found = await files.read(name);
  if (found) return found;
  // Local dev: create the file from data/cv.json so it can be opened and edited by hand.
  await files.create(name, seedDoc());
  return files.read(name);
}

async function write(name: DocName, doc: CVDoc) {
  if (useBlob()) return writeBlob(name, doc);
  return (await fileApi()).write(name, doc);
}

// ---------- public API ----------

/** Changes on every Publish; used to version the PDF URL. */
export const versionOf = (doc: CVDoc) =>
  `${doc.rev}-${Date.parse(doc.savedAt).toString(36)}`;

/** What visitors, the PDF and search engines see. Falls back to data/cv.json before the first publish. */
export async function getPublished(): Promise<CVDoc> {
  try {
    return (await read("published"))?.doc ?? seedDoc();
  } catch (e) {
    console.error(
      "[store] Could not read the published CV, showing data/cv.json:",
      e
    );
    return seedDoc();
  }
}

/** What the editor works on. Starts as a copy of the published CV. */
export async function getDraft(): Promise<CVDoc> {
  return (await read("draft"))?.doc ?? (await getPublished());
}

/** Saves the draft. `baseRev` is the revision the editor last loaded; a mismatch throws ConflictError. */
export async function saveDraft(cv: CV, baseRev: number): Promise<CVDoc> {
  const stored = await read("draft");
  const current = stored?.doc ?? (await getPublished());
  if (current.rev !== baseRev) throw new ConflictError(current);

  // The rev check above is the guard against overwriting another tab's save.
  // (Blob's ifMatch isn't used: the etag a read returns doesn't match the one a write compares against.)
  const next: CVDoc = {
    cv,
    rev: current.rev + 1,
    savedAt: new Date().toISOString(),
  };
  await write("draft", next);
  return next;
}

/** Copies the draft to published and stamps "Last updated" with today's date in Toronto. */
export async function publish(): Promise<CVDoc> {
  const draft = await getDraft();
  const published: CVDoc = {
    cv: { ...draft.cv, updatedAt: todayInToronto() },
    rev: draft.rev,
    savedAt: new Date().toISOString(),
  };
  await write("published", published);
  return published;
}

function todayInToronto() {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
  }).format(new Date());
}
