import type { ReactNode } from 'react';
import { useContentText, usePageText } from '../lib/content';
import { EditButton } from '../lib/edit';

/**
 * Page header on frosted material: eyebrow label + headline (+ intro), like an iOS large title.
 * With `pageId`, label/title/intro come from content/pages.json and are editable in edit mode.
 */
export function PageHeader({ pageId, label, title, children }: { pageId?: string; label: string; title: string; children?: ReactNode }) {
  const text = usePageText(pageId ?? '', { label, title });
  const tr = useContentText();
  const intro = pageId && text.intro !== undefined ? text.intro : null;
  const fallback = typeof children === 'string' ? tr(children) : children;
  return (
    <header className="container-page pt-6">
      <div className="material rounded-[28px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="section-title">{text.label ?? label}</p>
          {pageId ? <EditButton target={{ kind: 'page', id: pageId }} label="page text" /> : null}
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{text.title}</h1>
        {intro || fallback ? <div className="mt-4 max-w-2xl whitespace-pre-line text-muted">{intro || fallback}</div> : null}
      </div>
    </header>
  );
}
