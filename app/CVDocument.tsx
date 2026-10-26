'use client';

import { useEffect, useRef, useState } from 'react';
import { MotionConfig, Reorder, useDragControls, type DragControls } from 'motion/react';
import { dateRange, newId, visibleSections, type CV, type Contact, type Entry, type Section } from '@/lib/cv';
import Field, { focusField } from './Field';

/*
 * The CV itself, in two modes that share one layout:
 *   - Read (no `edit`): plain text, as visitors and the PDF see it. Hidden sections are left out.
 *   - Edit (`edit`):    every piece of text is a Field; entries and sections can be dragged,
 *                       added, duplicated, removed and hidden (DESIGN.md → Components → Edit mode).
 */

export type Edit = {
  /** Apply a change to a copy of the CV (mutate `cv` inside the function). */
  update: (change: (cv: CV) => void) => void;
};
type Update = Edit['update'];

const MAX_ENTRIES = 40;
const MAX_BULLETS = 12;
const MAX_GROUPS = 12;

export default function CVDocument({ cv, edit }: { cv: CV; edit?: Edit }) {
  return edit ? <EditCV cv={cv} update={edit.update} /> : <ReadCV cv={cv} />;
}

/* ======================= Read mode ======================= */

function ReadCV({ cv }: { cv: CV }) {
  const { profile } = cv;
  return (
    <>
      <header className="cv-header">
        <h1 className="cv-name">{profile.name}</h1>
        <p className="cv-role">{profile.role}</p>
        <p className="cv-contacts">
          <span>{profile.location}</span>
          {profile.contacts.map((c, i) => (
            <span key={`${c.label}-${i}`} className={c.printOnly ? 'print-only' : undefined}>
              {c.href ? <a className="link" href={c.href}>{c.text}</a> : c.text}
            </span>
          ))}
        </p>
      </header>

      {visibleSections(cv).map((s) => (
        <section key={s.id} className="cv-section" aria-labelledby={`h-${s.id}`}>
          <h2 id={`h-${s.id}`} className="section-label">{s.label}</h2>
          {s.entries && (
            <div className="entries">
              {s.entries.map((e) => <ReadEntry key={e.id} entry={e} />)}
            </div>
          )}
          {s.groups && (
            <dl className="skills">
              {s.groups.map((g, gi) => (
                <div key={`${g.label}-${gi}`} className="row">
                  <dt>{g.label}</dt>
                  <dd>{g.items.join(', ')}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </>
  );
}

function ReadEntry({ entry }: { entry: Entry }) {
  const meta = [entry.org, entry.location].filter(Boolean).join(' · ');
  const bullets = (entry.bullets ?? []).filter((b) => b.trim()); // a half-written empty line never shows
  return (
    <article className="entry">
      <p className="entry-date">{dateRange(entry)}</p>
      <div className="entry-main">
        <div className="entry-head">
          <h3 className="entry-title">{entry.title}</h3>
          {meta && <p className="entry-meta">{meta}</p>}
        </div>
        {bullets.length ? (
          <ul className="entry-body">
            {bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

/* ======================= Edit mode ======================= */

/** Finds a section by id inside the copy being changed (ids stay put while things are reordered). */
const sectionOf = (cv: CV, id: string) => cv.sections.find((s) => s.id === id)!;
const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
};

function EditCV({ cv, update }: { cv: CV; update: Update }) {
  const { profile, sections } = cv;
  return (
    <MotionConfig reducedMotion="user">
      <header className="cv-header">
        <h1 className="cv-name">
          <Field value={profile.name} placeholder="Your name" maxLength={120} onChange={(v) => update((c) => { c.profile.name = v; })} />
        </h1>
        <p className="cv-role">
          <Field value={profile.role} placeholder="Role" maxLength={120} onChange={(v) => update((c) => { c.profile.role = v; })} />
        </p>
        <p className="cv-contacts">
          <Field value={profile.location} placeholder="Location" maxLength={120} onChange={(v) => update((c) => { c.profile.location = v; })} />
        </p>
        <ContactsEditor contacts={profile.contacts} update={update} />
      </header>

      <Reorder.Group
        as="div"
        axis="y"
        className="sections"
        values={sections.map((s) => s.id)}
        onReorder={(ids) => update((c) => { c.sections = ids.map((id) => sectionOf(c, id)); })}
      >
        {sections.map((s, si) => (
          <SectionEditor key={s.id} section={s} isFirst={si === 0} isLast={si === sections.length - 1} update={update} />
        ))}
      </Reorder.Group>
    </MotionConfig>
  );
}

/* ---------- section: drag, hide (D4, D5) ---------- */

function SectionEditor({ section, isFirst, isLast, update }: { section: Section; isFirst: boolean; isLast: boolean; update: Update }) {
  const controls = useDragControls();
  const sid = section.id;
  const change = (fn: (s: Section) => void) => update((c) => fn(sectionOf(c, sid)));

  return (
    <Reorder.Item
      as="section"
      value={sid}
      dragListener={false}
      dragControls={controls}
      layout="position"
      className={`cv-section is-editing${section.hidden ? ' is-hidden' : ''}`}
      aria-label={`${section.label || 'Section'} section. Press Space, then arrow keys, to move it.`}
      whileDrag={{ boxShadow: 'var(--shadow-lift)' }}
    >
      <div className="section-head">
        <DragHandle controls={controls} label={`Drag ${section.label} section`} />
        <h2 className="section-label">
          <Field value={section.label} placeholder="Section" maxLength={60} onChange={(v) => change((s) => { s.label = v; })} />
        </h2>
        {section.hidden && <span className="override-mark">HIDDEN</span>}
        <div className="section-tools">
          <button type="button" className="btn btn-text btn-xs" aria-pressed={!!section.hidden}
            onClick={() => change((s) => { s.hidden = s.hidden ? undefined : true; })}>
            {section.hidden ? 'Show' : 'Hide'}
          </button>
          <ItemMenu
            label={`${section.label} section actions`}
            actions={[
              { label: 'Move up', disabled: isFirst, run: () => update((c) => move(c.sections, c.sections.findIndex((s) => s.id === sid), c.sections.findIndex((s) => s.id === sid) - 1)) },
              { label: 'Move down', disabled: isLast, run: () => update((c) => move(c.sections, c.sections.findIndex((s) => s.id === sid), c.sections.findIndex((s) => s.id === sid) + 1)) },
            ]}
          />
        </div>
      </div>

      <div className="section-body">
        {section.entries && <EntriesEditor sid={sid} entries={section.entries} update={update} />}
        {section.groups && <GroupsEditor sid={sid} groups={section.groups} update={update} />}
      </div>
    </Reorder.Item>
  );
}

/* ---------- entries: drag, add, duplicate, remove (D3, D4) ---------- */

function EntriesEditor({ sid, entries, update }: { sid: string; entries: Entry[]; update: Update }) {
  const list = (c: CV) => sectionOf(c, sid).entries!;

  function add() {
    const id = newId(sid);
    update((c) => { list(c).push({ id, start: '', title: '', bullets: [''] }); });
    focusField(`${id}:title`);
  }

  return (
    <>
      <Reorder.Group
        as="div"
        axis="y"
        className="entries"
        values={entries.map((e) => e.id)}
        onReorder={(ids) => update((c) => {
          const byId = new Map(list(c).map((e) => [e.id, e]));
          sectionOf(c, sid).entries = ids.map((id) => byId.get(id)!);
        })}
      >
        {entries.map((e, ei) => (
          <EntryEditor key={e.id} sid={sid} entry={e} index={ei} count={entries.length} update={update} />
        ))}
      </Reorder.Group>
      {entries.length < MAX_ENTRIES && (
        <button type="button" className="btn btn-text btn-xs add-item" onClick={add}>+ Add entry</button>
      )}
    </>
  );
}

function EntryEditor({ sid, entry, index, count, update }: { sid: string; entry: Entry; index: number; count: number; update: Update }) {
  const controls = useDragControls();
  const id = entry.id;
  const list = (c: CV) => sectionOf(c, sid).entries!;
  const set = (fn: (e: Entry) => void) => update((c) => { const e = list(c).find((x) => x.id === id); if (e) fn(e); });
  const opt = (v: string) => v || undefined; // empty optional text disappears from the published CV
  const bullets = entry.bullets ?? [];

  function addBullet(at: number) {
    if (bullets.length >= MAX_BULLETS) return;
    set((e) => { (e.bullets ??= []).splice(at, 0, ''); });
    focusField(`${id}:b${at}`);
  }
  function removeBullet(at: number) {
    set((e) => { e.bullets!.splice(at, 1); if (!e.bullets!.length) delete e.bullets; });
    focusField(at > 0 ? `${id}:b${at - 1}` : `${id}:title`);
  }

  return (
    <Reorder.Item
      as="article"
      value={id}
      dragListener={false}
      dragControls={controls}
      layout="position"
      className="entry is-editing"
      aria-label={`${entry.title || 'Untitled'}. Press Space, then arrow keys, to move it.`}
      whileDrag={{ boxShadow: 'var(--shadow-lift)' }}
    >
      <DragHandle controls={controls} label={`Drag ${entry.title || 'entry'}`} />

      <p className="entry-date">
        <Field value={entry.start} placeholder="Start" maxLength={40} onChange={(v) => set((e) => { e.start = v; })} />
        <span className="date-sep" aria-hidden="true"> — </span>
        <Field value={entry.end ?? ''} placeholder="End" maxLength={40} onChange={(v) => set((e) => { e.end = opt(v); })} />
      </p>
      <div className="entry-main">
        <div className="entry-head">
          <h3 className="entry-title">
            <Field value={entry.title} placeholder="Title" maxLength={200} focusKey={`${id}:title`}
              onChange={(v) => set((e) => { e.title = v; })} />
          </h3>
          <p className="entry-meta">
            <Field value={entry.org ?? ''} placeholder="Company or tools" maxLength={200} onChange={(v) => set((e) => { e.org = opt(v); })} />
            <span aria-hidden="true"> · </span>
            <Field value={entry.location ?? ''} placeholder="Location" maxLength={120} onChange={(v) => set((e) => { e.location = opt(v); })} />
          </p>
        </div>
        {bullets.length > 0 ? (
          <ul className="entry-body">
            {bullets.map((b, i) => (
              <li key={i}>
                <Field
                  value={b}
                  placeholder="Describe what you did — Enter adds another line"
                  maxLength={600}
                  focusKey={`${id}:b${i}`}
                  onChange={(v) => set((e) => { e.bullets![i] = v; })}
                  onEnter={() => addBullet(i + 1)}
                  onBackspaceEmpty={() => removeBullet(i)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <button type="button" className="btn btn-text btn-xs add-bullet" onClick={() => addBullet(0)}>+ Add bullet</button>
        )}
      </div>

      <ItemMenu
        label={`${entry.title || 'Entry'} actions`}
        actions={[
          { label: 'Move up', disabled: index === 0, run: () => update((c) => move(list(c), index, index - 1)) },
          { label: 'Move down', disabled: index === count - 1, run: () => update((c) => move(list(c), index, index + 1)) },
          { label: 'Duplicate', disabled: count >= MAX_ENTRIES, run: () => {
            const copyId = newId(sid);
            update((c) => { list(c).splice(index + 1, 0, { ...structuredClone(entry), id: copyId }); });
            focusField(`${copyId}:title`);
          } },
          { label: 'Remove', danger: true, run: () => update((c) => { list(c).splice(index, 1); }) },
        ]}
      />
    </Reorder.Item>
  );
}

/* ---------- skill groups ---------- */

function GroupsEditor({ sid, groups, update }: { sid: string; groups: NonNullable<Section['groups']>; update: Update }) {
  const list = (c: CV) => sectionOf(c, sid).groups!;
  return (
    <>
      <dl className="skills">
        {groups.map((g, gi) => (
          <div key={gi} className="row is-editing">
            <dt>
              <Field value={g.label} placeholder="Group" maxLength={60} focusKey={`${sid}:g${gi}`}
                onChange={(v) => update((c) => { list(c)[gi].label = v; })} />
            </dt>
            <dd>
              <Field
                value={g.items.join(', ')}
                placeholder="Comma, separated, skills"
                onChange={(v) => update((c) => { list(c)[gi].items = v.split(',').map((x) => x.trim()).filter(Boolean); })}
              />
            </dd>
            <ItemMenu
              label={`${g.label || 'Group'} actions`}
              actions={[
                { label: 'Move up', disabled: gi === 0, run: () => update((c) => move(list(c), gi, gi - 1)) },
                { label: 'Move down', disabled: gi === groups.length - 1, run: () => update((c) => move(list(c), gi, gi + 1)) },
                { label: 'Duplicate', disabled: groups.length >= MAX_GROUPS, run: () => update((c) => { list(c).splice(gi + 1, 0, structuredClone(g)); }) },
                { label: 'Remove', danger: true, run: () => update((c) => { list(c).splice(gi, 1); }) },
              ]}
            />
          </div>
        ))}
      </dl>
      {groups.length < MAX_GROUPS && (
        <button type="button" className="btn btn-text btn-xs add-item"
          onClick={() => { update((c) => { list(c).push({ label: '', items: [] }); }); focusField(`${sid}:g${groups.length}`); }}>
          + Add group
        </button>
      )}
    </>
  );
}

/* ---------- small parts ---------- */

function DragHandle({ controls, label }: { controls: DragControls; label: string }) {
  return (
    <button
      type="button"
      className="drag-handle"
      aria-label={label}
      title="Drag to reorder"
      tabIndex={-1} // keyboard users focus the item itself and press Space
      onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
    >
      <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
        {[2, 7, 12].flatMap((y) => [<circle key={`a${y}`} cx="2.5" cy={y} r="1.2" />, <circle key={`b${y}`} cx="7.5" cy={y} r="1.2" />])}
      </svg>
    </button>
  );
}

type Action = { label: string; run: () => void; disabled?: boolean; danger?: boolean };

/** The "⋯" menu. A danger action needs a second click (DESIGN.md: Remove is armed first). */
function ItemMenu({ label, actions }: { label: string; actions: Action[] }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setArmed(false); return; }
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLButtonElement>('.menu-trigger')?.focus(); }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus());
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="item-menu" ref={ref}>
      <button type="button" className="btn btn-icon btn-xs menu-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <circle cx="2.5" cy="7" r="1.3" /><circle cx="7" cy="7" r="1.3" /><circle cx="11.5" cy="7" r="1.3" />
        </svg>
      </button>
      {open && (
        <div className="menu" role="menu" aria-label={label}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              disabled={a.disabled}
              className={a.danger && armed ? 'is-armed' : undefined}
              onClick={() => {
                if (a.danger && !armed) { setArmed(true); return; }
                setOpen(false);
                a.run();
              }}
            >
              {a.danger && armed ? `${a.label} — click again` : a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- D6: contacts ---------- */

function ContactsEditor({ contacts, update }: { contacts: Contact[]; update: Update }) {
  const [armed, setArmed] = useState<number | null>(null);
  const change = (i: number, fn: (c: Contact) => void) => update((cv) => fn(cv.profile.contacts[i]));

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
              update((cv) => { cv.profile.contacts.splice(i, 1); });
            }}
            aria-label={armed === i ? `Confirm remove ${c.label}` : `Remove ${c.label}`}
          >
            {armed === i ? 'Remove?' : 'Remove'}
          </button>
        </div>
      ))}
      {contacts.length < 12 && (
        <button type="button" className="btn btn-text btn-xs add-contact"
          onClick={() => update((cv) => { cv.profile.contacts.push({ label: 'Phone', text: '', printOnly: true }); })}>
          + Add contact
        </button>
      )}
    </div>
  );
}