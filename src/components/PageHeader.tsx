import type { ReactNode } from 'react';
import { usePageText } from '../lib/content';
import { EditButton } from '../lib/edit';

/**
 * Portfolio-side page header: "// label" + mono headline + thin rule.
 * With `pageId`, label/title/intro come from content/pages.json and are editable in edit mode.
 */
export function PageHeader({ pageId, label, title, children }: { pageId?: string; label: string; title: string; children?: ReactNode }) {
  const text = usePageText(pageId ?? '', { label, title });
  const intro = pageId && text.intro !== undefined ? text.intro : null;
  return (
    <header className="container-page border-b border-line/60 pb-8 pt-12 sm:pt-16">
      <div className="flex items-center justify-between gap-3">
        <p className="section-title">{text.label ?? label}</p>
        {pageId ? <EditButton target={{ kind: 'page', id: pageId }} label="page text" /> : null}
      </div>
      <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight sm:text-4xl">{text.title}</h1>
      {intro || children ? <div className="mt-4 max-w-2xl whitespace-pre-line text-muted">{intro || children}</div> : null}
    </header>
  );
}
