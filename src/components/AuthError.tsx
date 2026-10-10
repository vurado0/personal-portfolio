import { signOutUser } from '../lib/auth';

/** Shown instead of an endless "Checking login…" when sign-in or the admin check fails. */
export function AuthError({ message, signedIn }: { message: string; signedIn: boolean }) {
  return (
    <div role="alert" className="mt-6 max-w-xl space-y-4 rounded-md border border-accent/70 px-4 py-3">
      <p className="font-mono font-bold">Login could not be completed</p>
      <p className="text-sm">{message}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => location.reload()}>
          Try again
        </button>
        {signedIn ? (
          <button type="button" className="btn-ghost" onClick={() => signOutUser().then(() => location.reload())}>
            Sign out
          </button>
        ) : null}
      </div>
    </div>
  );
}
