// Verifies the caller's Firebase ID token and that it belongs to ADMIN_UID.
// Only the project ID is needed: verifyIdToken checks the signature against Google's public keys.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function adminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not set');
  const app = getApps()[0] ?? initializeApp({ projectId });
  return getAuth(app);
}

/** Returns the admin uid, or sends 401/403/500 and returns null. */
export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid || !process.env.FIREBASE_PROJECT_ID) {
    res.status(500).json({ error: 'Server is missing FIREBASE_PROJECT_ID or ADMIN_UID' });
    return null;
  }
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Missing ID token' });
    return null;
  }
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if (decoded.uid !== adminUid) {
      res.status(403).json({ error: 'Not allowed' });
      return null;
    }
    return decoded.uid;
  } catch {
    res.status(401).json({ error: 'Invalid or expired ID token' });
    return null;
  }
}

export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  if (methods.includes(req.method ?? '')) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
  return false;
}
