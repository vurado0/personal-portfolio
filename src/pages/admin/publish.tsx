// Shared publishing UI: the "N unpublished changes · Publish" bar and the deploy status notice.
// Used by Admin → Content and by edit mode on the public pages.
import { useEffect, useState } from 'react';
import { buildContent, type Issue } from '../../lib/content-core/build';
import { deployStatus, publishChanges, type DeployState } from './contentApi';
import { useWorkspace } from './workspace';

export function validate(files: Record<string, string>, publicFiles: string[]): Issue[] {
  return buildContent(files, { includeDrafts: false, publicFiles: new Set(publicFiles) }).issues;
}

export type Published = { sha: string; url: string; state: DeployState; deployUrl?: string };

export function PublishBar({ section, onPublished, floating = false }: { section: string; onPublished: (p: { sha: string; url: string }) => void; floating?: boolean }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = ws.changes.length;
  // Collapse the review panel when switching sections so it never covers the editor.
  useEffect(() => setOpen(false), [section]);
  if (!count) return null;

  const errors = issues?.filter((i) => i.level === 'error') ?? [];
  const publish = async () => {
    setError(null);
    const found = validate(ws.files, ws.publicFiles);
    setIssues(found);
    setOpen(true);
    if (found.some((i) => i.level === 'error')) return;
    setBusy(true);
    try {
      const summary = message.trim() || `content: update ${[...new Set(ws.changes.map((c) => c.path.split('/')[1].replace(/\.(md|json)$/, '')))].join(', ')} via admin`;
      const r = await publishChanges(ws.headSha, summary, ws.changes);
      onPublished({ sha: r.commitSha, url: r.commitUrl });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        floating
          ? 'rounded-lg border border-accent/60 bg-bg/95 px-4 py-3 shadow-warm backdrop-blur'
          : 'sticky bottom-0 z-20 -mx-4 mt-10 border-t border-accent/60 bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-t-lg sm:border sm:px-5'
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="flex-1 text-left text-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="font-bold text-accent">{count}</span> unpublished change{count > 1 ? 's' : ''} <span className="text-muted">{open ? '▾' : '▸ review'}</span>
        </button>
        <button type="button" className="btn-primary" onClick={publish} disabled={busy}>
          {busy ? 'Publishing…' : 'Publish'}
        </button>
      </div>
      {open && (
        <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto border-t border-line/60 pt-3">
          <ul className="space-y-1 font-mono text-xs">
            {ws.changes.map((c) => (
              <li key={c.path}>
                <span className={c.content === null ? 'text-muted line-through' : c.path in ws.original ? 'text-fg' : 'text-accent'}>
                  {c.content === null ? '− ' : c.path in ws.original ? '~ ' : '+ '}
                  {c.path.replace('content/', '')}
                </span>
              </li>
            ))}
          </ul>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Change note (optional), e.g. Add Docker project" className="input text-sm" aria-label="Change note" />
          {errors.length > 0 && (
            <div role="alert" className="rounded-md border border-accent px-3 py-2 text-sm">
              <p className="font-bold">Fix these before publishing:</p>
              <ul className="mt-1 space-y-1">
                {errors.map((i) => (
                  <li key={i.file + i.message}>
                    • <span className="font-mono text-xs">{i.file.replace('content/', '')}</span>: {i.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm">
              {error}
            </p>
          )}
          <button
            type="button"
            className="chip min-h-9"
            onClick={() => {
              if (confirm('Discard all unpublished changes?')) {
                ws.discard();
                setIssues(null);
              }
            }}
          >
            discard all changes
          </button>
        </div>
      )}
    </div>
  );
}

export function DeployNotice({ published, onDismiss }: { published: Published; onDismiss: () => void }) {
  const label: Record<DeployState, string> = {
    pending: 'Deploying… the site updates in about a minute.',
    success: '✓ Live! Your changes are on the website.',
    failure: '✕ The deploy failed — the previous version stays online. Check the build log.',
    error: '✕ The deploy failed — the previous version stays online. Check the build log.',
  };
  return (
    <div role="status" className="mb-6 rounded-md border border-accent/70 bg-surface px-4 py-3 text-sm">
      <p className="font-bold">{label[published.state]}</p>
      <p className="mt-1 flex flex-wrap gap-4 text-xs">
        <a href={published.url} target="_blank" rel="noreferrer">
          commit ↗
        </a>
        {published.deployUrl ? (
          <a href={published.deployUrl} target="_blank" rel="noreferrer">
            deployment ↗
          </a>
        ) : null}
        {published.state !== 'pending' ? (
          <button type="button" className="underline" onClick={onDismiss}>
            dismiss
          </button>
        ) : null}
      </p>
    </div>
  );
}

/** Polls the Vercel deployment of the last publish (via GitHub commit statuses). */
export function useDeployPolling(published: Published | null, setPublished: (fn: (p: Published | null) => Published | null) => void) {
  useEffect(() => {
    if (!published || published.state !== 'pending') return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      try {
        const s = await deployStatus(published.sha);
        if (s.state !== 'pending' || tries > 60) {
          setPublished((p) => (p ? { ...p, state: s.state === 'pending' ? 'success' : s.state, deployUrl: s.url } : p));
        } else setPublished((p) => (p ? { ...p, deployUrl: s.url } : p));
      } catch {
        /* keep polling */
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [published?.sha, published?.state]);

}
