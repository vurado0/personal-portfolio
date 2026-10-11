import { apiFetch } from '../../lib/cloudinary';
import type { FileMap } from '../../lib/content-core/build';

export type Snapshot = { headSha: string; files: FileMap; publicFiles: string[] };
export type Change = { path: string; content: string | null };
export type DeployState = 'pending' | 'success' | 'failure' | 'error';

// The last snapshot is kept on this device; the server only answers "unchanged" while it is still
// the head of the branch, so a cached copy is never used once the content changed on GitHub.
const CACHE_KEY = 'content-snapshot';

function readCache(): Snapshot | null {
  try {
    const s = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Snapshot | null;
    return s?.headSha && s.files ? s : null;
  } catch {
    return null;
  }
}

function writeCache(s: Snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s));
  } catch {
    /* quota or blocked storage: just not cached */
  }
}

async function fetchSnapshot(): Promise<Snapshot> {
  const cached = readCache();
  const r = await apiFetch<Snapshot | { headSha: string; unchanged: true }>(cached ? `/api/content?since=${cached.headSha}` : '/api/content');
  if ('unchanged' in r && cached && cached.headSha === r.headSha) return cached;
  const fresh = r as Snapshot;
  writeCache(fresh);
  return fresh;
}

let inflight: { at: number; promise: Promise<Snapshot> } | null = null;

/** Content snapshot for the editor. Started as early as possible (see EditRoot) and shared for a short while. */
export function loadSnapshot({ fresh = false } = {}): Promise<Snapshot> {
  if (fresh || !inflight || Date.now() - inflight.at > 30_000) {
    const promise = fetchSnapshot();
    inflight = { at: Date.now(), promise };
    promise.catch(() => (inflight = null));
  }
  return inflight.promise;
}

export const publishChanges = (baseSha: string, message: string, changes: Change[]) =>
  apiFetch<{ commitSha: string; commitUrl: string }>('/api/content', {
    method: 'POST',
    body: JSON.stringify({ baseSha, message, changes }),
  });

/** Replaces public/cv.pdf (one commit on main, separate from the draft). */
export const uploadCvPdf = (baseSha: string, pdf: string) =>
  apiFetch<{ commitSha: string; commitUrl: string }>('/api/cv-upload', { method: 'POST', body: JSON.stringify({ baseSha, pdf }) });

export const deployStatus = (sha: string) => apiFetch<{ state: DeployState; url?: string }>(`/api/content?status=${sha}`);
