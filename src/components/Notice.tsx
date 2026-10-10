import type { ReactNode } from 'react';
import { Background } from './Background';

/** Empty/info state on a latte texture. */
export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Background name="latte-swirl" className="rounded-lg border border-line/60">
      <div className="px-6 py-12 text-center">
        <p className="blog-headline text-2xl">{title}</p>
        {children ? <div className="mx-auto mt-3 max-w-md text-sm text-muted">{children}</div> : null}
      </div>
    </Background>
  );
}
