import type { Heading } from '../types/content';
import { useT } from '../i18n';

export function Toc({ headings }: { headings: Heading[] }) {
  const t = useT();
  if (headings.length < 2) return null;
  return (
    <nav aria-label={t('toc.label')} className="font-mono text-xs">
      <p className="section-title mb-3">{t('toc.title')}</p>
      <ol className="space-y-1.5 border-l border-line/60">
        {headings.map((h) => (
          <li key={h.id} className={h.depth === 3 ? 'pl-6' : 'pl-3'}>
            <a href={`#${h.id}`} className="text-muted hover:text-accent">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
