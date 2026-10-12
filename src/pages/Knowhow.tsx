import { useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { KnowhowRow } from '../components/Cards';
import { TagChip } from '../components/Chips';
import { PageHeader } from '../components/PageHeader';
import { categoryLabel, useContent } from '../lib/content';
import { AddButton } from '../lib/edit';
import { Seo } from '../lib/head';
import { firstVisit, usePageDecode } from '../lib/decode';
import { useT } from '../i18n';
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
  const { content, knowhowCategories } = useContent();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tag = params.get('tag');
  const t = useT();
  // The whole page appears in a terminal "decode" style the first time it is opened in a visit.
  const anchor = useRef<HTMLDivElement>(null);
  const [decode] = useState(() => firstVisit('knowhow-decoded'));
  usePageDecode(anchor, decode);

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
      <PageHeader pageId={category ? undefined : 'knowhow'} label={t('knowhow.crumb')} title={category ? `${categoryLabel(category)}` : 'Knowledge base'}>
        Guides, cheat sheets and setups I keep coming back to.
      </PageHeader>
      <div ref={anchor} className="container-page grid gap-10 pt-8 lg:grid-cols-[13rem_1fr]">
        <aside className="font-mono text-sm lg:sticky lg:top-24 lg:self-start">
          <p className="section-title mb-3">{t('knowhow.categories')}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:block lg:space-y-1">
            <li>
              <Link to="/knowhow" className={!category ? 'text-accent' : 'text-fg'}>
                {!category ? '> ' : ''}
                {t('filter.allLower')} ({content.knowhow.length})
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
            <span className="sr-only">{t('knowhow.search')}</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-accent" aria-hidden="true">
              /
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => update({ q: e.target.value || null })}
              placeholder={t('knowhow.placeholder')}
              className="input pl-8 font-mono"
            />
          </label>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label={t('filter.byTag')}>
              {tags.map((tg) => (
                <TagChip key={tg} tag={`#${tg}`} active={tag === tg} onClick={() => update({ tag: tag === tg ? null : tg })} />
              ))}
            </div>
          )}
          <p className="mt-6 font-mono text-xs text-muted" aria-live="polite">
            {t(results.length === 1 ? 'knowhow.result' : 'knowhow.results', { n: results.length })}
          </p>
          <div className="mt-2">
            {results.map((d) => (
              <KnowhowRow key={d.url} doc={d} />
            ))}
          </div>
          <AddButton target={{ kind: 'knowhow', category }} label="New know-how article" className="mt-6" />
        </div>
      </div>
    </>
  );
}
