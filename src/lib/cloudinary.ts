// Signed uploads to Cloudinary (signature from /api/cloudinary-sign) and responsive delivery URLs.
import { cloudinaryCloudName } from './env';
import { getFirebase } from './firebase';

type Signature = { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string };
export type UploadResult = { secure_url: string; public_id: string; width: number; height: number };

async function idToken(): Promise<string> {
  const { auth } = await getFirebase();
  // Wait for the saved login to be restored (right after a page load currentUser is still null).
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Not signed in');
  return auth.currentUser.getIdToken();
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await idToken();
  const r = await fetch(path, {
    ...init,
    headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), authorization: `Bearer ${token}`, ...init.headers },
  });
  const ct = r.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error(`${path} did not return JSON (HTTP ${r.status}). Use \`vercel dev\` locally so /api functions run.`);
  }
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
  return json as T;
}

/** Uploads a Blob (or a remote image URL) with progress (0–1). */
export async function uploadToCloudinary(file: Blob | string, onProgress?: (p: number) => void): Promise<UploadResult> {
  const sig = await apiFetch<Signature>('/api/cloudinary-sign', { method: 'POST', body: '{}' });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json as UploadResult);
        else reject(new Error(json.error?.message ?? `Upload failed (HTTP ${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

export async function deleteFromCloudinary(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  await apiFetch('/api/cloudinary-delete', { method: 'POST', body: JSON.stringify({ publicIds }) });
}

/** Adds f_auto,q_auto and a width to a Cloudinary delivery URL. Non-Cloudinary URLs pass through. */
export function cldUrl(url: string, width?: number): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const t = ['f_auto', 'q_auto', ...(width ? [`w_${width}`, 'c_limit'] : [])].join(',');
  return url.replace('/upload/', `/upload/${t}/`);
}

export function cldSrcSet(url: string, widths = [320, 640, 960, 1280, 1920]): string | undefined {
  if (!url.includes('res.cloudinary.com')) return undefined;
  return widths.map((w) => `${cldUrl(url, w)} ${w}w`).join(', ');
}

export const cloudinaryConfigured = Boolean(cloudinaryCloudName);
