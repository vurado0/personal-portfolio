// Firebase is loaded lazily (dynamic import) so portfolio pages never download or prerender it.
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig, firebaseConfigured, useEmulators } from './env';

type Firebase = { app: FirebaseApp; auth: Auth; db: Firestore };

let instance: Promise<Firebase> | null = null;

export class NotConfiguredError extends Error {
  constructor() {
    super('Firebase is not configured (VITE_FIREBASE_* environment variables are missing).');
  }
}

export function getFirebase(): Promise<Firebase> {
  if (!firebaseConfigured) return Promise.reject(new NotConfiguredError());
  instance ??= (async () => {
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);
    if (useEmulators) {
      authMod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      fsMod.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    return { app, auth, db };
  })();
  return instance;
}
