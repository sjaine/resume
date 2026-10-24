import { dateRange, formatUpdated, getCV, type Entry, type Section } from '@/lib/cv';
import Logo from './Logo';
import DownloadButton from './DownloadButton';
import AdminControl from './AdminControl';

export default function Page() {
  const { profile, sections, updatedAt } = getCV();

  return (
    <>
      <Logo />
      <DownloadButton />

      <main className="page">
        <header className="cv-header">
          <h1 className="cv-name">{profile.name}</h1>
          <p className="cv-role">{profile.role}</p>
          <p className="cv-contacts">
            <span>{profile.location}</span>
            {profile.contacts.map((c) => (
              <span key={c.label} className={c.printOnly ? 'print-only' : undefined}>
                {c.href ? <a className="link" href={c.href}>{c.text}</a> : c.text}
              </span>
            ))}
          </p>
        </header>

        {sections.map((s) => <CVSection key={s.id} section={s} />)}

        <footer className="cv-footer">
          <span>
            Last updated <time className="data" dateTime={updatedAt}>{formatUpdated(updatedAt)}</time>
          </span>
          <AdminControl />
        </footer>
      </main>
    </>
  );
}

function CVSection({ section }: { section: Section }) {
  const headingId = `h-${section.id}`;
  return (
    <section className="cv-section" aria-labelledby={headingId}>
      <h2 id={headingId} className="section-label">{section.label}</h2>

      {section.entries && (
        <div className="entries">
          {section.entries.map((e) => <CVEntry key={e.id} entry={e} />)}
        </div>
      )}

      {section.groups && (
        <dl className="skills">
          {section.groups.map((g) => (
            <div key={g.label} className="row">
              <dt>{g.label}</dt>
              <dd>{g.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function CVEntry({ entry }: { entry: Entry }) {
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
