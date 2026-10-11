// Admin → Content: edit everything in /content (skills, projects, know-how, articles, profile, CV,
// certificates, hobbies). Changes collect locally, are validated with the same rules as the build,
// and are published as one commit on GitHub; Vercel then redeploys the site (~1 min).
import { useEffect, useState } from 'react';
import { loadSnapshot, type Snapshot } from './contentApi';
import { DeployNotice, PublishBar, useDeployPolling, type Published } from './publish';
import { DocsEditor } from './DocsEditor';
import { CertificatesEditor, HobbiesEditor, ProfileEditor } from './JsonEditors';
import { CvOverview, NavEditor } from './ItemForms';
import { SkillsEditor } from './SkillsEditor';
import { useWorkspace, WorkspaceProvider } from './workspace';

const SECTIONS = [
  { id: 'profile', label: 'Profile', render: () => <ProfileEditor /> },
  { id: 'navigation', label: 'Menu', render: () => <NavEditor /> },
  { id: 'skills', label: 'Skills', render: () => <SkillsEditor /> },
  { id: 'projects', label: 'Projects', render: () => <DocsEditor kind="projects" /> },
  { id: 'knowhow', label: 'Know-how', render: () => <DocsEditor kind="knowhow" /> },
  { id: 'articles', label: 'Articles', render: () => <DocsEditor kind="articles" /> },
  { id: 'cv', label: 'About / CV', render: () => <CvOverview /> },
  { id: 'certificates', label: 'Certificates', render: () => <CertificatesEditor /> },
  { id: 'hobbies', label: 'Hobbies', render: () => <HobbiesEditor /> },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function Editor({ onPublished }: { onPublished: (p: { sha: string; url: string }) => void }) {
  const ws = useWorkspace();
  const [section, setSection] = useState<SectionId>('profile');
  const current = SECTIONS.find((s) => s.id === section)!;
  const changedSections = new Set(
    ws.changes.map((c) => {
      const part = c.path.split('/')[1].replace(/\.(md|json)$/, '');
      return part === 'blog' ? 'articles' : part;
    }),
  );
  return (
    <>
      <nav aria-label="Content sections" className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-pressed={section === s.id}
            className={`chip min-h-10 flex-none ${section === s.id ? 'border-accent bg-accent text-on-accent' : 'text-fg'}`}
          >
            {s.label}
            {changedSections.has(s.id) ? <span aria-label="has changes"> •</span> : null}
          </button>
        ))}
      </nav>
      {/* key: reset local form state when switching sections */}
      <div key={section}>{current.render()}</div>
      <PublishBar section={section} onPublished={onPublished} />
    </>
  );
}

export default function ContentAdmin() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Published | null>(null);

  const reload = () => {
    setError(null);
    loadSnapshot().then(setSnapshot, (e) => setError((e as Error).message));
  };
  useEffect(reload, []);

  useDeployPolling(published, setPublished);

  if (error)
    return (
      <div role="alert" className="space-y-3">
        <p className="font-bold">Content could not be loaded.</p>
        <p className="text-sm text-muted">{error}</p>
        <button type="button" className="btn-ghost" onClick={reload}>
          Try again
        </button>
      </div>
    );
  if (!snapshot) return <p className="text-muted">Loading content from GitHub…</p>;

  return (
    <>
      {published && <DeployNotice published={published} onDismiss={() => setPublished(null)} />}
      <WorkspaceProvider key={snapshot.headSha} snapshot={snapshot}>
        <Editor
          onPublished={({ sha, url }) => {
            setPublished({ sha, url, state: 'pending' });
            try {
              localStorage.removeItem('content-draft');
            } catch {
              /* ignore */
            }
            loadSnapshot({ fresh: true }).then(setSnapshot, (e) => setError((e as Error).message));
          }}
        />
      </WorkspaceProvider>
    </>
  );
}
