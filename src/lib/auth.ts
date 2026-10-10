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
  | { status: 'admin'; user: User }
  /** Something did not answer or failed — shown with the reason instead of loading forever. */
  | { status: 'error'; user: User | null; message: string };

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

const REDIRECT_KEY = 'auth-redirect-pending';
const AUTH_TIMEOUT = 15_000;
const ADMIN_CHECK_TIMEOUT = 12_000;

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new TimeoutError(what)), ms))]);
}

function explain(e: unknown, step: 'auth' | 'admin'): string {
  const code = (e as { code?: string }).code ?? '';
  if (e instanceof TimeoutError || code === 'unavailable' || /offline/i.test(String((e as Error)?.message)))
    return step === 'auth'
      ? 'Firebase sign-in did not answer. A privacy setting or browser extension may be blocking Google sign-in on this site.'
      : 'Could not reach the database (firestore.googleapis.com). An ad blocker or privacy extension may block it — allow it for this site and try again.';
  if (code === 'permission-denied')
    return 'The database refused to read your admin document. Check that firestore.rules are published in the Firebase console.';
  return `${(e as Error)?.message ?? String(e)}${code ? ` (${code})` : ''}`;
}

export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>(firebaseConfigured ? { status: 'loading' } : { status: 'unconfigured' });
  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsub = () => {};
    let alive = true;
    let answered = false;
    const set = (next: AuthState) => alive && setState(next);
    const authTimer = setTimeout(() => {
      if (!answered) set({ status: 'error', user: null, message: explain(new TimeoutError(), 'auth') });
    }, AUTH_TIMEOUT);

    (async () => {
      const { auth, db } = await getFirebase();
      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      if (!alive) return;
      // Only finish a redirect sign-in that was actually started (popup fallback). Calling this on
      // every load can stall in browsers that block third-party storage.
      let redirectPending = false;
      try {
        redirectPending = sessionStorage.getItem(REDIRECT_KEY) === '1';
        sessionStorage.removeItem(REDIRECT_KEY);
      } catch {
        /* ignore */
      }
      if (redirectPending) getRedirectResult(auth).catch((e) => set({ status: 'error', user: null, message: explain(e, 'auth') }));

      unsub = onAuthStateChanged(auth, async (user) => {
        answered = true;
        clearTimeout(authTimer);
        if (!user) {
          setAdminHint(false);
          return set({ status: 'signed-out' });
        }
        set({ status: 'loading' });
        try {
          const snap = await withTimeout(getDoc(doc(db, 'admins', user.uid)), ADMIN_CHECK_TIMEOUT, 'admin check');
          setAdminHint(snap.exists());
          set(snap.exists() ? { status: 'admin', user } : { status: 'denied', user });
        } catch (e) {
          console.error('Admin check failed', e);
          set({ status: 'error', user, message: explain(e, 'admin') });
        }
      });
    })().catch((e) => {
      clearTimeout(authTimer);
      console.error('Firebase init failed', e);
      set({ status: 'error', user: null, message: explain(e, 'auth') });
    });

    return () => {
      alive = false;
      clearTimeout(authTimer);
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
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      try {
        sessionStorage.setItem(REDIRECT_KEY, '1');
      } catch {
        /* ignore */
      }
      await signInWithRedirect(auth, provider);
    }
    else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') throw e;
  }
}

export async function signOutUser(): Promise<void> {
  const { auth } = await getFirebase();
  const { signOut } = await import('firebase/auth');
  setAdminHint(false);
  try {
    sessionStorage.removeItem('edit-mode');
  } catch {
    /* ignore */
  }
  await signOut(auth);
}

/** Full log-out: signs out of Google/Firebase and starts fresh on the guest / owner login page. */
export async function logOut(): Promise<void> {
  try {
    if (localStorage.getItem('content-draft') && !confirm('You have unpublished edits. They stay saved on this device. Log out anyway?')) return;
  } catch {
    /* storage blocked */
  }
  try {
    await signOutUser();
  } finally {
    location.assign('/login');
  }
}
