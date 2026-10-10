// /admin — owner-only area: feed posts (phone friendly), site content and contact messages.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { AuthError } from '../components/AuthError';
import { signOutUser, useAdminAuth } from '../lib/auth';
import { cldUrl, deleteFromCloudinary } from '../lib/cloudinary';
import { deleteMessage, deletePostDoc, getPost, listAllPosts, listMessages, updatePost, type Message, type Post } from '../lib/feed';
import { formatDateTime } from '../lib/format';
import { Seo } from '../lib/head';
import { typeLabel } from '../components/feed/PostCard';
import { PostEditor } from './admin/PostEditor';

// The content editor (yaml, markdown, validation) only loads when its tab is opened.
const ContentAdmin = lazy(() => import('./admin/ContentAdmin'));

// ---------------------------------------------------------------------------

function PostList({ onEdit }: { onEdit: (p: Post) => void }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () => listAllPosts().then(setPosts, (e) => setError((e as Error).message));
  useEffect(() => {
    reload();
  }, []);

  const remove = async (p: Post) => {
    if (!confirm('Delete this post and its images permanently?')) return;
    const ids = [...p.images.map((i) => i.publicId), p.music?.coverPublicId].filter((x): x is string => Boolean(x));
    try {
      await deleteFromCloudinary(ids);
    } catch (e) {
      if (!confirm(`Images could not be deleted from Cloudinary (${(e as Error).message}). Delete the post anyway?`)) return;
    }
    await deletePostDoc(p.id);
    reload();
  };
  const togglePublished = async (p: Post) => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
    await updatePost(p.id, { ...rest, published: !p.published });
    reload();
  };

  if (error) return <p role="alert">{error}</p>;
  if (!posts) return <p className="text-muted">Loading…</p>;
  if (!posts.length) return <p className="text-muted">No posts yet. Write your first one!</p>;
  return (
    <ul className="divide-y divide-line/50">
      {posts.map((p) => (
        <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {p.images[0] || p.music?.coverUrl ? (
              <img src={cldUrl(p.images[0]?.url ?? p.music!.coverUrl, 120)} alt="" className="h-12 w-12 flex-none rounded object-cover" />
            ) : (
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded bg-surface text-muted">{p.badge ?? '¶'}</span>
            )}
            <div className="min-w-0">
              <p className="truncate">{p.music?.title || p.text || '(no text)'}</p>
              <p className="font-mono text-xs text-muted">
                {typeLabel[p.type]} · {formatDateTime(p.createdAt)} · {p.published ? <span className="text-accent">published</span> : 'draft'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip min-h-9" onClick={() => onEdit(p)}>
              edit
            </button>
            <button type="button" className="chip min-h-9" onClick={() => togglePublished(p)}>
              {p.published ? 'unpublish' : 'publish'}
            </button>
            {p.published ? (
              <a className="chip min-h-9 text-fg" href={`/blog/p/${p.id}`} target="_blank" rel="noreferrer">
                view
              </a>
            ) : null}
            <button type="button" className="chip min-h-9 hover:border-red-500" onClick={() => remove(p)}>
              delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Messages() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () => listMessages().then(setMessages, (e) => setError((e as Error).message));
  useEffect(() => {
    reload();
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!messages) return <p className="text-muted">Loading…</p>;
  if (!messages.length) return <p className="text-muted">No messages.</p>;
  return (
    <ul className="space-y-4">
      {messages.map((m) => (
        <li key={m.id} className="card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-bold">
              {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>
            </p>
            <p className="font-mono text-xs text-muted">{formatDateTime(m.createdAt)}</p>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
          <button
            type="button"
            className="chip mt-3 min-h-9"
            onClick={async () => {
              if (confirm('Delete this message?')) {
                await deleteMessage(m.id);
                reload();
              }
            }}
          >
            delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Admin() {
  const auth = useAdminAuth();
  const [tab, setTab] = useState<'posts' | 'editor' | 'content' | 'messages'>('posts');
  const [editing, setEditing] = useState<Post | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [params, setParams] = useSearchParams();
  const postParam = params.get('post');

  const openEditor = (p: Post | null) => {
    setEditing(p);
    setEditorKey((k) => k + 1);
    setTab('editor');
    window.scrollTo(0, 0);
  };
  const tabs = useMemo(
    () =>
      [
        ['posts', 'Posts'],
        ['editor', editing ? 'Edit post' : 'New post'],
        ['content', 'Content'],
        ['messages', 'Messages'],
      ] as const,
    [editing],
  );

  // "✎" on a feed post in edit mode links here with ?post=<id>.
  useEffect(() => {
    if (auth.status !== 'admin' || !postParam) return;
    getPost(postParam).then((p) => {
      if (p) openEditor(p);
      setParams({}, { replace: true });
    });
  }, [auth.status, postParam]); // eslint-disable-line react-hooks/exhaustive-deps

  if (auth.status === 'signed-out' || auth.status === 'denied') return <Navigate to="/login?next=/admin" replace />;

  return (
    <>
      <Seo title="Admin" noindex />
      <div className="container-page max-w-4xl pt-10">
        <p className="section-title">admin</p>
        {auth.status === 'unconfigured' ? (
          <p className="mt-6">Firebase is not configured. Add the VITE_FIREBASE_* variables (see README).</p>
        ) : auth.status === 'loading' ? (
          <p className="mt-6 font-mono text-sm text-muted">Checking login…</p>
        ) : auth.status === 'error' ? (
          <AuthError message={auth.message} signedIn={Boolean(auth.user)} />
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-mono text-2xl font-bold">Hi, {auth.user.displayName?.split(' ')[0] ?? 'admin'} ☕</h1>
              <div className="flex gap-2">
                <a href="/" className="chip min-h-9 text-fg">
                  view site
                </a>
                <button type="button" className="chip min-h-9" onClick={signOutUser}>
                  sign out
                </button>
              </div>
            </div>
            <div className="-mx-4 mt-6 flex gap-1 overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-line/60 px-4 sm:mx-0 sm:px-0" role="tablist">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => (id === 'editor' && tab !== 'editor' ? openEditor(null) : setTab(id))}
                  className={`-mb-px min-h-11 flex-none border-b-2 px-3 font-mono text-sm ${tab === id ? 'border-accent text-fg' : 'border-transparent text-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-6">
              {tab === 'posts' && <PostList onEdit={openEditor} />}
              {tab === 'editor' && (
                <PostEditor
                  key={editorKey}
                  editing={editing}
                  onDone={() => {
                    setEditing(null);
                    setTab('posts');
                  }}
                />
              )}
              {tab === 'content' && (
                <Suspense fallback={<p className="text-muted">Loading editor…</p>}>
                  <ContentAdmin />
                </Suspense>
              )}
              {tab === 'messages' && <Messages />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
