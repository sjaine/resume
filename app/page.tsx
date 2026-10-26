import { getPublished, versionOf } from '@/lib/store';
import Logo from './Logo';
import CVApp from './CVApp';

/*
 * The public page. The server renders the published CV (fast, and what the PDF is made from);
 * CVApp turns the same page into the editor once you log in.
 */
export default async function Page() {
  const doc = await getPublished();
  return (
    <>
      <Logo />
      <CVApp published={doc.cv} publishedRev={doc.rev} publishedAt={doc.savedAt} version={versionOf(doc)} />
    </>
  );
}