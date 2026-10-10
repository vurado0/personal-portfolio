// Firestore access for feed posts and contact messages.
import { useEffect, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { getFirebase, NotConfiguredError } from './firebase';

export type PostType = 'photo' | 'text' | 'achievement' | 'music';
export const POST_TYPES: PostType[] = ['photo', 'text', 'achievement', 'music'];

export type PostImage = { url: string; publicId: string; width: number; height: number; alt: string };

export type MusicInfo = {
  provider: 'spotify' | 'soundcloud';
  url: string;
  embedUrl: string;
  title: string;
  artist: string;
  coverUrl: string;
  coverPublicId?: string;
};

export type Post = {
  id: string;
  type: PostType;
  text: string;
  images: PostImage[];
  music?: MusicInfo | null;
  tags: string[];
  skills: string[];
  mood?: string;
  /** Emoji/badge shown on achievement posts */
  badge?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

export type Message = { id: string; name: string; email: string; message: string; createdAt: Date };

type Snap = QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>;

function toDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function')
    return (v as { toDate: () => Date }).toDate();
  return new Date();
}

function toPost(snap: Snap): Post {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    type: (d.type as PostType) ?? 'text',
    text: d.text ?? '',
    images: d.images ?? [],
    music: d.music ?? null,
    tags: d.tags ?? [],
    skills: d.skills ?? [],
    mood: d.mood || undefined,
    badge: d.badge || undefined,
    published: d.published === true,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt ?? d.createdAt),
  };
}

// ---- Public reads (must filter published == true, see firestore.rules) ----

let publishedCache: { at: number; promise: Promise<Post[]> } | null = null;

export function listPublishedPosts(max = 100): Promise<Post[]> {
  if (publishedCache && Date.now() - publishedCache.at < 60_000) return publishedCache.promise;
  const promise = (async () => {
    const { db } = await getFirebase();
    const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
    const q = query(collection(db, 'posts'), where('published', '==', true), orderBy('createdAt', 'desc'), limit(max));
    return (await getDocs(q)).docs.map(toPost);
  })();
  publishedCache = { at: Date.now(), promise };
  promise.catch(() => (publishedCache = null));
  return promise;
}

export async function getPost(id: string): Promise<Post | null> {
  const { db } = await getFirebase();
  const { doc, getDoc } = await import('firebase/firestore');
  try {
    const snap = await getDoc(doc(db, 'posts', id));
    return snap.exists() ? toPost(snap) : null;
  } catch (e) {
    // Unpublished posts are rejected by the rules for visitors: treat as "not found".
    if ((e as { code?: string }).code === 'permission-denied') return null;
    throw e;
  }
}

export type AsyncState<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'unconfigured' } | { status: 'error'; error: Error };

/** Published posts for public pages. Loads client-side only (feed is not prerendered). */
export function usePublishedPosts(max = 100): AsyncState<Post[]> {
  const [state, setState] = useState<AsyncState<Post[]>>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    // Edit mode fires this after deleting a post so lists refresh.
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener('feed-changed', onChange);
    return () => window.removeEventListener('feed-changed', onChange);
  }, []);
  useEffect(() => {
    let alive = true;
    listPublishedPosts(max).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: Error) => {
        if (!alive) return;
        if (error instanceof NotConfiguredError) setState({ status: 'unconfigured' });
        else {
          console.error(error);
          setState({ status: 'error', error });
        }
      },
    );
    return () => {
      alive = false;
    };
  }, [max, version]);
  return state;
}

// ---- Admin --------------------------------------------------------------

export async function listAllPosts(): Promise<Post[]> {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
  return snap.docs.map(toPost);
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  // Firestore rejects `undefined` values.
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function createPost(input: PostInput): Promise<string> {
  const { db } = await getFirebase();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  const ref = await addDoc(collection(db, 'posts'), {
    ...clean(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  publishedCache = null;
  return ref.id;
}

export async function updatePost(id: string, input: PostInput): Promise<void> {
  const { db } = await getFirebase();
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'posts', id), { ...clean(input), updatedAt: serverTimestamp() });
  publishedCache = null;
}

export async function deletePostDoc(id: string): Promise<void> {
  const { db } = await getFirebase();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'posts', id));
  publishedCache = null;
}

// ---- Contact messages ---------------------------------------------------

export async function sendMessage(input: { name: string; email: string; message: string }): Promise<void> {
  const { db } = await getFirebase();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  await addDoc(collection(db, 'messages'), { ...input, createdAt: serverTimestamp() });
}

export async function listMessages(): Promise<Message[]> {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, name: x.name ?? '', email: x.email ?? '', message: x.message ?? '', createdAt: toDate(x.createdAt) };
  });
}

export async function deleteMessage(id: string): Promise<void> {
  const { db } = await getFirebase();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'messages', id));
}
