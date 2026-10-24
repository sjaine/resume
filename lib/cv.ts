import data from '@/data/cv.json';

/*
 * The CV's content model. In stage 1 it is read from data/cv.json;
 * in stage 3 the same shape comes from the database, so components don't change.
 */

export type Contact = { label: string; text: string; href?: string; printOnly?: boolean };

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
  | { id: string; label: string; entries: Entry[]; groups?: never }
  | { id: string; label: string; groups: SkillGroup[]; entries?: never };

export type CV = {
  profile: { name: string; role: string; location: string; contacts: Contact[] };
  sections: Section[];
  updatedAt: string;
};

export const getCV = (): CV => data as CV;

/** "Sep 2025 — Present", or "2024" for single dates. */
export const dateRange = (e: Entry) => (e.end ? `${e.start} — ${e.end}` : e.start);

export const formatUpdated = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
