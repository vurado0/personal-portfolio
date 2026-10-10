// /login — the owner's sign-in page (Google). Visitors never need an account.
import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import backgrounds from '../generated/backgrounds.json';
import { useContent } from '../lib/content';
import { AuthError } from '../components/AuthError';
import { signInWithGoogle, signOutUser, useAdminAuth } from '../lib/auth';
import { setEditMode } from '../lib/edit';
import { Seo } from '../lib/head';

function GoogleIcon() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-espresso" aria-hidden="true">
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EADBC8" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
      <path fill="#F5ECDF" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path fill="#C8A27A" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6L6.4 14z" />
      <path fill="#D9822B" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z" />
    </svg>
    </span>
  );
}

export default function Login() {
  const auth = useAdminAuth();
  const [params] = useSearchParams();
  const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/admin';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bg = backgrounds['espresso-shot'];
  const site = useContent().content.profile;

  // "Sign in" in the header asks to come back to the same page with edit mode on.
  const wantEdit = params.get('edit') === '1';
  useEffect(() => {
    if (auth.status === 'admin' && wantEdit) setEditMode(true);
  }, [auth.status, wantEdit]);

  if (auth.status === 'admin') return <Navigate to={next} replace />;

  const signIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(
        code === 'auth/unauthorized-domain'
          ? `This domain (${location.hostname}) is not authorised in Firebase → Authentication → Settings → Authorized domains.`
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Login" noindex />
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: `linear-gradient(90deg, rgb(var(--bg)) 15%, rgb(var(--bg) / 0.75) 55%, rgb(var(--bg) / 0.2)), url(${bg.src}), url(${bg.placeholder})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
          aria-hidden="true"
        />
        <div className="container-page relative flex min-h-[calc(100vh-4rem)] items-center py-16">
          <div className="w-full max-w-md">
            <p className="font-mono text-sm text-muted">
              <span className="text-accent">$</span> sudo login
            </p>
            <h1 className="mt-4 font-mono text-4xl font-bold leading-tight sm:text-5xl">
              Welcome<span className="text-accent">.</span>
            </h1>
            <p className="mt-3 text-muted">
              Portfolio of <span className="text-fg">{site.name}</span> — {site.role}.
            </p>

            <section className="card mt-8 space-y-4" aria-labelledby="guest-title">
              <div>
                <p className="label">visitor · recruiter</p>
                <h2 id="guest-title" className="mt-1 font-mono text-lg font-bold">
                  View as guest
                </h2>
                <p className="mt-1 text-sm text-muted">No account needed. See the CV, projects and skills — read-only.</p>
              </div>
              <Link to="/about" className="btn-primary w-full hover:no-underline">
                Continue as guest →
              </Link>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                <Link to="/projects" className="chip text-fg hover:no-underline">
                  projects
                </Link>
                <Link to="/skills" className="chip text-fg hover:no-underline">
                  skills
                </Link>
                <Link to="/contact" className="chip text-fg hover:no-underline">
                  contact
                </Link>
                <a href="/cv.pdf" className="chip text-fg hover:no-underline" download>
                  ↓ cv.pdf
                </a>
              </div>
            </section>

            <div className="card mt-4 space-y-5">
              <div>
                <p className="label">owner</p>
                <h2 className="mt-1 font-mono text-lg font-bold">Sign in to edit</h2>
              </div>
              {auth.status === 'unconfigured' ? (
                <p className="text-sm">Firebase is not configured yet (VITE_FIREBASE_* variables are missing).</p>
              ) : auth.status === 'loading' ? (
                <p className="font-mono text-sm text-muted">Checking session…</p>
              ) : auth.status === 'error' ? (
                <AuthError message={auth.message} signedIn={Boolean(auth.user)} />
              ) : auth.status === 'denied' ? (
                <>
                  <p className="font-mono text-sm">
                    Signed in as <span className="text-accent">{auth.user.email}</span>, but this account is not the owner.
                  </p>
                  <details className="text-xs text-muted">
                    <summary className="cursor-pointer">This is my account — how do I get access?</summary>
                    <p className="mt-2">
                      Create the Firestore document <code>admins/{auth.user.uid}</code> with <code>role: "admin"</code>, and set <code>ADMIN_UID={auth.user.uid}</code> in Vercel. Then reload this page.
                    </p>
                  </details>
                  <button type="button" className="btn-ghost w-full" onClick={signOutUser}>
                    Use another account
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-ghost w-full gap-3" onClick={signIn} disabled={busy}>
                    <GoogleIcon />
                    {busy ? 'Opening Google…' : 'Continue with Google'}
                  </button>
                  <p className="text-center font-mono text-[11px] uppercase tracking-label text-muted">owner only · no visitor accounts</p>
                </>
              )}
              {error && (
                <p role="alert" className="text-sm">
                  {error}
                </p>
              )}
            </div>
            <p className="mt-6 font-mono text-xs">
              <Link to="/">← back to the website</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
