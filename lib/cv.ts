/*
 * The CV's content model. Stored as JSON by lib/store.ts (data/cv.json is the starting copy).
 */
export type Contact = {
  label: string;
  text: string;
  href?: string;
  printOnly?: boolean;
};

export type Entry = {
  id: string;
  start: string;
  end?: string; // omit for a single date ("2024"); "Present" for current roles
  title: string;
  org?: string; // company, school, issuer or tech stack
  location?: string;
  bullets?: string[];
};

export type SkillGroup = { label: string; items: string[] };

export type Section =
  | {
      id: string;
      label: string;
      hidden?: boolean;
      entries: Entry[];
      groups?: never;
    }
  | {
      id: string;
      label: string;
      hidden?: boolean;
      groups: SkillGroup[];
      entries?: never;
    };

export type CV = {
  profile: {
    name: string;
    role: string;
    location: string;
    contacts: Contact[];
  };
  sections: Section[];
  updatedAt: string;
};

/** A short unique id for a new entry, e.g. "experience-k3x9q2". */
export const newId = (prefix: string) =>
  `${prefix.slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}`;

/** Sections visitors and the PDF see (hidden ones stay in the draft for later). */
export const visibleSections = (cv: CV) => cv.sections.filter((s) => !s.hidden);

/** "Sep 2025 — Present", or "2024" for single dates. */
export const dateRange = (e: Entry) =>
  e.end ? `${e.start} — ${e.end}` : e.start;

export const formatUpdated = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** Checks that a value has the CV shape before it is saved. Returns an error message, or null if valid. */
export function validateCV(v: unknown): string | null {
  const isStr = (x: unknown, max = 600) =>
    typeof x === "string" && x.length <= max;
  const optStr = (x: unknown, max = 600) => x === undefined || isStr(x, max);
  const arr = (x: unknown, max: number): x is unknown[] =>
    Array.isArray(x) && x.length <= max;
  const obj = (x: unknown): x is Record<string, unknown> =>
    !!x && typeof x === "object" && !Array.isArray(x);

  if (!obj(v)) return "CV must be an object.";
  const p = v.profile;
  if (
    !obj(p) ||
    !isStr(p.name, 120) ||
    !isStr(p.role, 120) ||
    !isStr(p.location, 120)
  )
    return "Profile is incomplete.";
  if (!arr(p.contacts, 12)) return "Contacts must be a list.";
  for (const c of p.contacts)
    if (
      !obj(c) ||
      !isStr(c.label, 40) ||
      !isStr(c.text, 200) ||
      !optStr(c.href, 400) ||
      !(c.printOnly === undefined || typeof c.printOnly === "boolean")
    )
      return "A contact is malformed.";
  if (!arr(v.sections, 20)) return "Sections must be a list.";
  for (const s of v.sections) {
    if (
      !obj(s) ||
      !isStr(s.id, 60) ||
      !isStr(s.label, 60) ||
      !(s.hidden === undefined || typeof s.hidden === "boolean")
    )
      return "A section is malformed.";
    if (s.entries !== undefined) {
      if (!arr(s.entries, 40)) return `${s.label}: entries must be a list.`;
      for (const e of s.entries)
        if (
          !obj(e) ||
          !isStr(e.id, 60) ||
          !isStr(e.start, 40) ||
          !optStr(e.end, 40) ||
          !isStr(e.title, 200) ||
          !optStr(e.org, 200) ||
          !optStr(e.location, 120) ||
          !(
            e.bullets === undefined ||
            (arr(e.bullets, 12) && e.bullets.every((b) => isStr(b, 600)))
          )
        )
          return `${s.label}: an entry is malformed.`;
    } else if (s.groups !== undefined) {
      if (!arr(s.groups, 12)) return `${s.label}: groups must be a list.`;
      for (const g of s.groups)
        if (
          !obj(g) ||
          !isStr(g.label, 60) ||
          !arr(g.items, 60) ||
          !g.items.every((i) => isStr(i, 120))
        )
          return `${s.label}: a group is malformed.`;
    } else return `${s.label}: needs entries or groups.`;
  }
  if (!isStr(v.updatedAt, 10)) return "updatedAt must be a YYYY-MM-DD date.";
  return null;
}
