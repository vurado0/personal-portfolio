// Owner login (Google via Firebase Auth). Admin = a Firestore document admins/{uid} exists.
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { firebaseConfigured } from './env';
import { getFirebase } from './firebase';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'denied'; user: User }
  | { status: 'admin'; user: User };

/** Cheap hint for public pages (no Firebase download): shows the "Admin" link in the header. */
const HINT_KEY = 'is-admin';
export function adminHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}
function setAdminHint(on: boolean) {
  try {
    if (on) localStorage.setItem(HINT_KEY, '1');
    else localStorage.removeItem(HINT_KEY);
  } catch {
    /* ignore */
  }
}

export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>(firebaseConfigured ? { status: 'loading' } : { status: 'unconfigured' });
  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsub = () => {};
    let alive = true;
    (async () => {
      const { auth, db } = await getFirebase();
      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      if (!alive) return;
      // Completes the redirect fallback of signInWithGoogle (used when popups are blocked).
      getRedirectResult(auth).catch((e) => console.warn('Google redirect sign-in failed', e));
      unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setAdminHint(false);
          return setState({ status: 'signed-out' });
        }
        try {
          const snap = await getDoc(doc(db, 'admins', user.uid));
          setAdminHint(snap.exists());
          setState(snap.exists() ? { status: 'admin', user } : { status: 'denied', user });
        } catch {
          setState({ status: 'denied', user });
        }
      });
    })();
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return state;
}

export async function signInWithGoogle(): Promise<void> {
  const { auth } = await getFirebase();
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') await signInWithRedirect(auth, provider);
    else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') throw e;
  }
}

export async function signOutUser(): Promise<void> {
  const { auth } = await getFirebase();
  const { signOut } = await import('firebase/auth');
  setAdminHint(false);
  await signOut(auth);
}
