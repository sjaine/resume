'use client';

import { useState } from 'react';
import { dateRange, type CV, type Contact, type Entry, type Section } from '@/lib/cv';
import Field from './Field';

/*
 * The CV itself. One component for both modes so reading and editing share the exact same layout:
 *   - without `edit`: plain text, as visitors and the PDF see it
 *   - with `edit`:    every piece of text becomes a Field you can click and type into
 */

export type Edit = {
  /** Apply a change to a copy of the CV (mutate `cv` inside the function). */
  update: (change: (cv: CV) => void) => void;
};

export default function CVDocument({ cv, edit }: { cv: CV; edit?: Edit }) {
  const { profile, sections } = cv;
  const set = edit?.update;

  return (
    <>
      <header className="cv-header">
        <h1 className="cv-name">
          {set ? <Field value={profile.name} placeholder="Your name" maxLength={120} onChange={(v) => set((c) => { c.profile.name = v; })} /> : profile.name}
        </h1>
        <p className="cv-role">
          {set ? <Field value={profile.role} placeholder="Role" maxLength={120} onChange={(v) => set((c) => { c.profile.role = v; })} /> : profile.role}
        </p>

        {set ? (
          <>
            <p className="cv-contacts">
              <Field value={profile.location} placeholder="Location" maxLength={120} onChange={(v) => set((c) => { c.profile.location = v; })} />
            </p>
            <ContactsEditor contacts={profile.contacts} update={set} />
          </>
        ) : (
          <p className="cv-contacts">
            <span>{profile.location}</span>
            {profile.contacts.map((c, i) => (
              <span key={`${c.label}-${i}`} className={c.printOnly ? 'print-only' : undefined}>
                {c.href ? <a className="link" href={c.href}>{c.text}</a> : c.text}
              </span>
            ))}
          </p>
        )}
      </header>

      {sections.map((s, si) => <CVSection key={s.id} section={s} index={si} update={set} />)}
    </>
  );
}

function CVSection({ section, index, update: set }: { section: Section; index: number; update?: Edit['update'] }) {
  const headingId = `h-${section.id}`;
  return (
    <section className="cv-section" aria-labelledby={headingId}>
      <h2 id={headingId} className="section-label">
        {set ? <Field value={section.label} placeholder="Section" maxLength={60} onChange={(v) => set((c) => { c.sections[index].label = v; })} /> : section.label}
      </h2>

      {section.entries && (
        <div className="entries">
          {section.entries.map((e, ei) => (
            <CVEntry key={e.id} entry={e} update={set && ((change) => set((c) => change(c.sections[index].entries![ei])))} />
          ))}
        </div>
      )}

      {section.groups && (
        <dl className="skills">
          {section.groups.map((g, gi) => (
            <div key={`${g.label}-${gi}`} className="row">
              <dt>
                {set ? <Field value={g.label} placeholder="Group" maxLength={60} onChange={(v) => set((c) => { c.sections[index].groups![gi].label = v; })} /> : g.label}
              </dt>
              <dd>
                {set ? (
                  <Field
                    value={g.items.join(', ')}
                    placeholder="Comma, separated, skills"
                    onChange={(v) => set((c) => { c.sections[index].groups![gi].items = v.split(',').map((x) => x.trim()).filter(Boolean); })}
                  />
                ) : g.items.join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function CVEntry({ entry, update: set }: { entry: Entry; update?: (change: (e: Entry) => void) => void }) {
  if (!set) {
    const meta = [entry.org, entry.location].filter(Boolean).join(' · ');
    return (
      <article className="entry">
        <p className="entry-date">{dateRange(entry)}</p>
        <div className="entry-main">
          <div className="entry-head">
            <h3 className="entry-title">{entry.title}</h3>
            {meta && <p className="entry-meta">{meta}</p>}
          </div>
          {entry.bullets?.length ? (
            <ul className="entry-body">
              {entry.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : null}
        </div>
      </article>
    );
  }

  // Optional text: an empty field is stored as "missing", so it disappears from the published CV.
  const opt = (v: string) => v || undefined;

  return (
    <article className="entry">
      <p className="entry-date">
        <Field value={entry.start} placeholder="Start" maxLength={40} onChange={(v) => set((e) => { e.start = v; })} />
        <span className="date-sep" aria-hidden="true"> — </span>
        <Field value={entry.end ?? ''} placeholder="End" maxLength={40} onChange={(v) => set((e) => { e.end = opt(v); })} />
      </p>
      <div className="entry-main">
        <div className="entry-head">
          <h3 className="entry-title">
            <Field value={entry.title} placeholder="Title" maxLength={200} onChange={(v) => set((e) => { e.title = v; })} />
          </h3>
          <p className="entry-meta">
            <Field value={entry.org ?? ''} placeholder="Company or tools" maxLength={200} onChange={(v) => set((e) => { e.org = opt(v); })} />
            <span aria-hidden="true"> · </span>
            <Field value={entry.location ?? ''} placeholder="Location" maxLength={120} onChange={(v) => set((e) => { e.location = opt(v); })} />
          </p>
        </div>
        {entry.bullets?.length ? (
          <ul className="entry-body">
            {entry.bullets.map((b, i) => (
              <li key={i}>
                <Field value={b} placeholder="Describe what you did" maxLength={600} onChange={(v) => set((e) => { e.bullets![i] = v; })} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

/* ---------- D6: contacts ---------- */

function ContactsEditor({ contacts, update: set }: { contacts: Contact[]; update: Edit['update'] }) {
  const [armed, setArmed] = useState<number | null>(null);
  const change = (i: number, fn: (c: Contact) => void) => set((cv) => fn(cv.profile.contacts[i]));

  return (
    <div className="contacts-edit" role="group" aria-label="Contacts">
      {contacts.map((c, i) => (
        <div className="contact-row" key={i}>
          <Field className="contact-label" value={c.label} placeholder="Label" maxLength={40} onChange={(v) => change(i, (x) => { x.label = v; })} />
          <Field className="contact-text" value={c.text} placeholder="Shown as" maxLength={200} onChange={(v) => change(i, (x) => { x.text = v; })} />
          <Field className="contact-href" value={c.href ?? ''} placeholder="Link (https://, mailto:, tel:)" maxLength={400}
            onChange={(v) => change(i, (x) => { x.href = v || undefined; })} />
          <label className="contact-pdf">
            <input type="checkbox" checked={!!c.printOnly} onChange={(e) => change(i, (x) => { x.printOnly = e.target.checked || undefined; })} />
            PDF only
          </label>
          <button
            type="button"
            className={`btn btn-xs ${armed === i ? 'btn-danger' : 'btn-text'}`}
            onClick={() => {
              if (armed !== i) { setArmed(i); setTimeout(() => setArmed((a) => (a === i ? null : a)), 3000); return; }
              setArmed(null);
              set((cv) => { cv.profile.contacts.splice(i, 1); });
            }}
            aria-label={armed === i ? `Confirm remove ${c.label}` : `Remove ${c.label}`}
          >
            {armed === i ? 'Remove?' : 'Remove'}
          </button>
        </div>
      ))}
      {contacts.length < 12 && (
        <button type="button" className="btn btn-text btn-xs add-contact"
          onClick={() => set((cv) => { cv.profile.contacts.push({ label: 'Phone', text: '', printOnly: true }); })}>
          + Add contact
        </button>
      )}
    </div>
  );
}