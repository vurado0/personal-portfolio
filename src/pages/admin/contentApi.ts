import { apiFetch } from '../../lib/cloudinary';
import type { FileMap } from '../../lib/content-core/build';

export type Snapshot = { headSha: string; files: FileMap; publicFiles: string[] };
export type Change = { path: string; content: string | null };
export type DeployState = 'pending' | 'success' | 'failure' | 'error';

export const loadSnapshot = () => apiFetch<Snapshot>('/api/content');

export const publishChanges = (baseSha: string, message: string, changes: Change[]) =>
  apiFetch<{ commitSha: string; commitUrl: string }>('/api/content', {
    method: 'POST',
    body: JSON.stringify({ baseSha, message, changes }),
  });

/** Replaces public/cv.pdf (one commit on main, separate from the draft). */
export const uploadCvPdf = (baseSha: string, pdf: string) =>
  apiFetch<{ commitSha: string; commitUrl: string }>('/api/cv-upload', { method: 'POST', body: JSON.stringify({ baseSha, pdf }) });

export const deployStatus = (sha: string) => apiFetch<{ state: DeployState; url?: string }>(`/api/content?status=${sha}`);
