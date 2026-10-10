import type { ReactNode } from 'react';

/** Portfolio-side page header: "// label" + mono headline + thin rule. */
export function PageHeader({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <header className="container-page border-b border-line/60 pb-8 pt-12 sm:pt-16">
      <p className="section-title">{label}</p>
      <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {children ? <div className="mt-4 max-w-2xl text-muted">{children}</div> : null}
    </header>
  );
}
