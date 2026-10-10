import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { KnowhowRow } from '../components/Cards';
import { TagChip } from '../components/Chips';
import { PageHeader } from '../components/PageHeader';
import { categoryLabel, content, knowhowCategories } from '../lib/content';
import { Seo } from '../lib/head';
import type { KnowhowDoc } from '../types/content';

function score(doc: KnowhowDoc, terms: string[]): number {
  const title = doc.title.toLowerCase();
  const meta = `${doc.summary} ${doc.tags.join(' ')} ${doc.skills.join(' ')} ${doc.category}`.toLowerCase();
  const body = doc.text.toLowerCase();
  let total = 0;
  for (const t of terms) {
    const s = (title.includes(t) ? 10 : 0) + (meta.includes(t) ? 4 : 0) + (body.includes(t) ? 1 : 0);
    if (s === 0) return 0; // every term must match somewhere
    total += s;
  }
  return total;
}

export default function Knowhow() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tag = params.get('tag');

  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) (v ? p.set(k, v) : p.delete(k));
    setParams(p, { replace: true });
  };

  const inCategory = content.knowhow.filter((d) => !category || d.category === category);
  const tags = useMemo(() => [...new Set(inCategory.flatMap((d) => d.tags))].sort(), [inCategory]);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = inCategory
    .filter((d) => !tag || d.tags.includes(tag))
    .map((d) => ({ d, s: terms.length ? score(d, terms) : 1 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.d);

  const title = category ? `${categoryLabel(category)} know-how` : 'Know-how';
  return (
    <>
      <Seo title={title} description="My IT knowledge base: guides, cheat sheets and setups." path={category ? `/knowhow/${category}` : '/knowhow'} />
      <PageHeader label="know-how" title={category ? `${categoryLabel(category)}` : 'Knowledge base'}>
        Guides, cheat sheets and setups I keep coming back to.
      </PageHeader>
      <div className="container-page grid gap-10 pt-8 lg:grid-cols-[13rem_1fr]">
        <aside className="font-mono text-sm lg:sticky lg:top-24 lg:self-start">
          <p className="section-title mb-3">categories</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:block lg:space-y-1">
            <li>
              <Link to="/knowhow" className={!category ? 'text-accent' : 'text-fg'}>
                {!category ? '> ' : ''}all ({content.knowhow.length})
              </Link>
            </li>
            {knowhowCategories.map((c) => (
              <li key={c}>
                <Link to={`/knowhow/${c}`} className={category === c ? 'text-accent' : 'text-fg'}>
                  {category === c ? '> ' : ''}
                  {categoryLabel(c)} ({content.knowhow.filter((d) => d.category === c).length})
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div>
          <label className="relative block">
            <span className="sr-only">Search know-how</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-accent" aria-hidden="true">
              /
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => update({ q: e.target.value || null })}
              placeholder="grep the knowledge base…"
              className="input pl-8 font-mono"
            />
          </label>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
              {tags.map((t) => (
                <TagChip key={t} tag={`#${t}`} active={tag === t} onClick={() => update({ tag: tag === t ? null : t })} />
              ))}
            </div>
          )}
          <p className="mt-6 font-mono text-xs text-muted" aria-live="polite">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
          <div className="mt-2">
            {results.map((d) => (
              <KnowhowRow key={d.url} doc={d} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
