import type { Heading } from '../types/content';

export function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;
  return (
    <nav aria-label="Table of contents" className="font-mono text-xs">
      <p className="section-title mb-3">contents</p>
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
