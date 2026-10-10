// Edit mode for the owner: loaded lazily by EditRoot (src/lib/edit.tsx) only after an admin login.
// Provides the live content (published + unpublished edits) to every page, a drawer with the
// right form for whatever ✎ / + was clicked, delete/move actions and a floating publish bar.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import hljs from 'highlight.js/lib/common';
import { logOut, useAdminAuth } from '../lib/auth';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { buildContent } from '../lib/content-core/build';
import { EditContextProvider, setEditMode, type EditApi, type EditTarget } from '../lib/edit';
import { deletePostDoc, getPost, type Post } from '../lib/feed';
import { PostEditor } from '../pages/admin/PostEditor';
import { PageTextForm } from '../pages/admin/ItemForms';
import { loadSnapshot, type Snapshot } from '../pages/admin/contentApi';
import { DocForm, emptyDoc, toDoc, type DocKind } from '../pages/admin/DocsEditor';
import { CERTS, CertificateForm, CV, CvEntryForm, CvPdfForm, CvPersonalForm, CvSectionForm, HOBBIES, HobbyForm, NavEditor, readCv } from '../pages/admin/ItemForms';
import { ProfileEditor } from '../pages/admin/JsonEditors';
import { DeployNotice, PublishBar, useDeployPolling, type Published } from '../pages/admin/publish';
import { prettyJson, readJsonFile } from '../pages/admin/serialize';
import { deleteSkill, GroupsForm, SkillForm } from '../pages/admin/SkillsEditor';
import { useWorkspace, WorkspaceProvider, type Workspace } from '../pages/admin/workspace';
import type { Certificate, CvSection, Hobby } from '../types/content';

const highlight = (code: string, lang: string) => (hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : null);

const docPath = (target: EditTarget): string | undefined => {
  if (target.kind === 'project') return target.slug ? `content/projects/${target.slug}.md` : undefined;
  if (target.kind === 'knowhow' || target.kind === 'article') return target.path;
  return undefined;
};

function swap<T>(list: T[], i: number, dir: -1 | 1): T[] | null {
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return null;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ---- Delete & move -------------------------------------------------------------

async function removeTarget(ws: Workspace, target: EditTarget, label: string): Promise<void> {
  const ask = (what = label) => confirm(`Delete "${what}"?\n\nThe change goes live when you publish.`);
  switch (target.kind) {
    case 'skill':
      if (target.id) deleteSkill(ws, target.id, label);
      return;
    case 'project':
    case 'knowhow':
    case 'article': {
      const path = docPath(target);
      if (path && ask()) ws.write({ [path]: null });
      return;
    }
    case 'certificate': {
      const all = readJsonFile<Certificate[]>(ws.files[CERTS], []);
      if (ask()) ws.write({ [CERTS]: prettyJson(all.filter((c) => c.id !== target.id)) });
      return;
    }
    case 'hobby': {
      const all = readJsonFile<Hobby[]>(ws.files[HOBBIES], []);
      if (ask()) ws.write({ [HOBBIES]: prettyJson(all.filter((h) => h.id !== target.id)) });
      return;
    }
    case 'cv-section': {
      const cv = readCv(ws.files);
      if (confirm(`Delete the CV section "${label.replace(/^section /, '')}" and everything in it?`))
        ws.write({ [CV]: prettyJson({ ...cv, sections: cv.sections.filter((s) => s.id !== target.id) }) });
      return;
    }
    case 'cv-entry': {
      const cv = readCv(ws.files);
      if (!ask()) return;
      const sections = cv.sections.map((s) =>
        s.id === target.section && s.type !== 'text' ? ({ ...s, items: (s.items as unknown[]).filter((_, i) => i !== target.index) } as CvSection) : s,
      );
      ws.write({ [CV]: prettyJson({ ...cv, sections }) });
      return;
    }
    case 'post': {
      // Feed posts live in Firestore (not in the repo): deleted immediately, including their images.
      if (!confirm(`Delete the post "${label}" now? This cannot be undone.`)) return;
      const post = await getPost(target.id);
      const ids = [...(post?.images.map((i) => i.publicId) ?? []), post?.music?.coverPublicId].filter((x): x is string => Boolean(x) && !x!.startsWith('sample/'));
      try {
        await deleteFromCloudinary(ids);
      } catch (e) {
        if (!confirm(`Images could not be deleted from Cloudinary (${(e as Error).message}). Delete the post anyway?`)) return;
      }
      await deletePostDoc(target.id);
      window.dispatchEvent(new Event('feed-changed'));
      return;
    }
  }
}

const MOVABLE = new Set(['cv-section', 'cv-entry', 'certificate', 'hobby']);

function moveTarget(ws: Workspace, target: EditTarget, dir: -1 | 1) {
  if (target.kind === 'cv-section') {
    const cv = readCv(ws.files);
    const next = swap(cv.sections, cv.sections.findIndex((s) => s.id === target.id), dir);
    if (next) ws.write({ [CV]: prettyJson({ ...cv, sections: next }) });
  } else if (target.kind === 'cv-entry') {
    const cv = readCv(ws.files);
    const sections = cv.sections.map((s) => {
      if (s.id !== target.section || s.type === 'text' || target.index === undefined) return s;
      const next = swap(s.items as unknown[], target.index, dir);
      return next ? ({ ...s, items: next } as CvSection) : s;
    });
    ws.write({ [CV]: prettyJson({ ...cv, sections }) });
  } else if (target.kind === 'certificate' || target.kind === 'hobby') {
    const file = target.kind === 'certificate' ? CERTS : HOBBIES;
    const all = readJsonFile<{ id: string }[]>(ws.files[file], []);
    const next = swap(all, all.findIndex((x) => x.id === target.id), dir);
    if (next) ws.write({ [file]: prettyJson(next) });
  }
}

// ---- Drawer ------------------------------------------------------------------------

function FormFor({ target, onDone, onPublished }: { target: EditTarget; onDone: () => void; onPublished: (p: { sha: string; url: string }) => void }) {
  const ws = useWorkspace();
  switch (target.kind) {
    case 'profile':
      return <ProfileEditor onDone={onDone} />;
    case 'nav':
      return <NavEditor onDone={onDone} />;
    case 'skill-groups':
      return <GroupsForm onDone={onDone} />;
    case 'skill': {
      const existing = ws.skills.find((s) => s.id === target.id);
      return existing ? (
        <SkillForm skill={existing} isNew={false} onDone={onDone} />
      ) : (
        <SkillForm skill={{ id: '', name: '', group: target.group ?? ws.groups[0]?.id ?? '', level: 3, context: '' }} isNew onDone={onDone} />
      );
    }
    case 'project':
    case 'knowhow':
    case 'article': {
      const kind: DocKind = target.kind === 'project' ? 'projects' : target.kind === 'knowhow' ? 'knowhow' : 'articles';
      const path = docPath(target);
      const firstCategory = Object.keys(ws.files).find((p) => p.startsWith('content/knowhow/'))?.split('/')[2] ?? 'linux';
      const doc = path && ws.files[path] ? toDoc(kind, path, ws.files[path]) : emptyDoc(kind, (target.kind === 'knowhow' && target.category) || firstCategory);
      return <DocForm kind={kind} doc={doc} onDone={onDone} />;
    }
    case 'certificate':
      return <CertificateForm id={target.id} onDone={onDone} />;
    case 'hobby':
      return <HobbyForm id={target.id} onDone={onDone} />;
    case 'cv-personal':
      return <CvPersonalForm onDone={onDone} />;
    case 'cv-pdf':
      return <CvPdfForm onDone={onDone} onUploaded={onPublished} />;
    case 'cv-section':
      return <CvSectionForm id={target.id} onDone={onDone} />;
    case 'cv-entry':
      return <CvEntryForm section={target.section} index={target.index} onDone={onDone} />;
    case 'post':
      return <PostLoader id={target.id} onDone={onDone} />;
    case 'post-new':
      return (
        <>
          <h3 className="mb-4 font-mono text-xl font-bold">New post</h3>
          <PostEditor editing={null} onDone={onDone} />
        </>
      );
    case 'page':
      return <PageTextForm id={target.id} onDone={onDone} />;
  }
}

function PostLoader({ id, onDone }: { id: string; onDone: () => void }) {
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  useEffect(() => {
    getPost(id).then(setPost, () => setPost(null));
  }, [id]);
  if (post === undefined) return <p className="text-muted">Loading post…</p>;
  if (post === null) return <p>Post not found.</p>;
  return (
    <>
      <h3 className="mb-4 font-mono text-xl font-bold">Edit post</h3>
      <PostEditor editing={post} onDone={onDone} />
    </>
  );
}

function Drawer({ target, onClose, onPublished }: { target: EditTarget; onClose: () => void; onPublished: (p: { sha: string; url: string }) => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Edit">
      <button type="button" className="absolute inset-0 bg-espresso/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Close editor" tabIndex={-1} />
      <div ref={panel} className="relative h-full w-full overflow-y-auto border-l border-line bg-bg px-4 pb-28 pt-4 font-mono text-[15px] shadow-warm sm:w-[36rem] sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="section-title">edit</p>
          <button type="button" className="chip min-h-9" onClick={onClose} aria-label="Close">
            ✕ close
          </button>
        </div>
        <FormFor target={target} onDone={onClose} onPublished={onPublished} />
      </div>
    </div>
  );
}

// ---- Edit session ---------------------------------------------------------------------

function LiveEdit({ children, onPublished, published, onDismiss }: { children: ReactNode; onPublished: (p: { sha: string; url: string }) => void; published: Published | null; onDismiss: () => void }) {
  const ws = useWorkspace();
  const [target, setTarget] = useState<EditTarget | null>(null);
  const bundle = useMemo(() => buildContent(ws.files, { includeDrafts: true, publicFiles: new Set(ws.publicFiles), highlight }).bundle, [ws.files, ws.publicFiles]);
  const close = useCallback(() => setTarget(null), []);

  const api = useMemo<EditApi>(
    () => ({
      bundle,
      open: (t) => setTarget(t),
      remove: (t, label) => {
        removeTarget(ws, t, label).catch((e) => alert((e as Error).message));
      },
      move: (t, dir) => moveTarget(ws, t, dir),
      canMove: (t) => MOVABLE.has(t.kind),
    }),
    [bundle, ws],
  );

  return (
    <EditContextProvider value={api}>
      <div className="pb-36">{children}</div>
      {target ? <Drawer target={target} onClose={close} onPublished={onPublished} /> : null}
      <div className="fixed inset-x-0 bottom-0 z-50 space-y-2 p-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[28rem] sm:p-0">
        {published ? <DeployNotice published={published} onDismiss={onDismiss} /> : null}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-bg/95 px-3 py-2 font-mono text-xs shadow-warm backdrop-blur">
          <span className="mr-auto font-bold text-accent">✎ edit mode</span>
          <button type="button" className="chip min-h-9" onClick={() => setTarget({ kind: 'nav' })}>
            menu
          </button>
          <button type="button" className="chip min-h-9" onClick={() => setTarget({ kind: 'profile' })}>
            profile
          </button>
          <button type="button" className="chip min-h-9" onClick={() => setEditMode(false)} title="Back to the visitor view (unpublished changes are kept)">
            done
          </button>
          <Link to="/admin" className="chip min-h-9 text-fg">
            admin
          </Link>
          <button type="button" className="chip min-h-9" onClick={logOut} title="Sign out and go to the login page">
            log out
          </button>
        </div>
        <PublishBar section={target ? 'drawer' : 'page'} onPublished={onPublished} floating />
      </div>
    </EditContextProvider>
  );
}

function EditSession({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Published | null>(null);
  useEffect(() => {
    loadSnapshot().then(setSnapshot, (e) => setError((e as Error).message));
  }, []);
  useDeployPolling(published, setPublished);

  if (!snapshot)
    return (
      <>
        {children}
        <p role="status" className="fixed bottom-4 right-4 z-50 rounded-md border border-line bg-bg/95 px-3 py-2 font-mono text-xs shadow-warm">
          {error ? `✎ edit mode unavailable: ${error}` : '✎ loading editor…'}
        </p>
      </>
    );

  return (
    <WorkspaceProvider key={snapshot.headSha} snapshot={snapshot}>
      <LiveEdit
        published={published}
        onDismiss={() => setPublished(null)}
        onPublished={({ sha, url }) => {
          setPublished({ sha, url, state: 'pending' });
          try {
            localStorage.removeItem('content-draft');
          } catch {
            /* ignore */
          }
          loadSnapshot().then(setSnapshot, (e) => setError((e as Error).message));
        }}
      >
        {children}
      </LiveEdit>
    </WorkspaceProvider>
  );
}

/** Checks the login; only a verified admin gets edit mode, everyone else sees the plain page. */
export function EditProvider({ children }: { children: ReactNode }) {
  const auth = useAdminAuth();
  const { pathname } = useLocation();
  if (auth.status === 'admin') return <EditSession>{children}</EditSession>;
  if (auth.status === 'loading') return <>{children}</>;
  return (
    <>
      {children}
      <p role="status" className="fixed bottom-4 right-4 z-50 max-w-xs rounded-md border border-accent/60 bg-bg/95 px-3 py-2 font-mono text-xs shadow-warm">
        ✎ Edit mode needs a fresh login.{' '}
        <Link to={`/login?next=${encodeURIComponent(pathname)}&edit=1`}>Sign in</Link> ·{' '}
        <button type="button" className="underline" onClick={() => setEditMode(false)}>
          cancel
        </button>
      </p>
    </>
  );
}
