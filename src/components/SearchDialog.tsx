// Site search (⌘K / Ctrl+K / "/"): pages, skills, know-how, projects, articles and CV entries from the
// content bundle, in the current language. Runs entirely in the browser; this chunk is only loaded
// when the search is opened (see Search.tsx).
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { buildNav } from '../config/navigation';
import { isEnabled } from '../config/site';
import { useT, type MessageKey } from '../i18n';
import { categoryLabel, useContent } from '../lib/content';
import type { ContentBundle } from '../types/content';

type Kind = 'pages' | 'skills' | 'knowhow' | 'projects' | 'articles' | 'cv';

type Entry = {
  kind: Kind;
  title: string;
  detail?: string;
  url: string;
  /** Searchable texts (lower-case, without accents) with their weight. */
  fields: [string, number][];
};

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

function entry(kind: Kind, title: string, url: string, detail: string | undefined, fields: [string | undefined, number][]): Entry {
  return { kind, title, url, detail, fields: [[fold(title), 8], ...fields.filter((f): f is [string, number] => Boolean(f[0])).map(([s, w]) => [fold(s), w] as [string, number])] };
}

function buildIndex(c: ContentBundle): Entry[] {
  const out: Entry[] = [];
  for (const n of buildNav(c.navigation).filter((i) => i.enabled && isEnabled(i.id))) out.push(entry('pages', n.label, n.path, undefined, [[n.id, 4]]));
  out.push(entry('pages', 'Impressum', '/impressum', undefined, [['imprint legal', 2]]));
  out.push(entry('pages', 'Datenschutz', '/datenschutz', undefined, [['privacy policy gdpr dsgvo', 2]]));
  if (isEnabled('skills')) {
    const groups = new Map(c.skillGroups.map((g) => [g.id, g.label]));
    for (const s of c.skills) out.push(entry('skills', s.name, `/skills#skill-${s.id}`, groups.get(s.group), [[s.id, 4], [s.context, 2], [groups.get(s.group), 2]]));
  }
  if (isEnabled('knowhow'))
    for (const d of c.knowhow) {
      const category = categoryLabel(d.category);
      out.push(entry('knowhow', d.title, d.url, category, [[d.tags.join(' '), 4], [category, 3], [d.summary, 2], [d.headings.map((h) => h.text).join(' '), 2], [d.text, 1]]));
    }
  if (isEnabled('projects'))
    for (const p of c.projects)
      out.push(entry('projects', p.title, p.url, p.stack.slice(0, 3).join(', '), [[[...p.tags, ...p.stack].join(' '), 4], [p.summary, 2], [p.role, 2], [p.text, 1]]));
  if (isEnabled('blog')) for (const a of c.articles) out.push(entry('articles', a.title, a.url, a.date, [[a.tags.join(' '), 4], [a.summary, 2], [a.text, 1]]));
  if (isEnabled('about'))
    for (const s of c.cv.sections) {
      if (s.type === 'timeline') for (const e of s.items) out.push(entry('cv', e.title, '/about', e.org, [[e.org, 4], [e.location, 2], [e.text, 1], [s.title, 1]]));
      if (s.type === 'languages') for (const l of s.items) out.push(entry('cv', l.name, '/about', s.title, [[s.title, 2], [l.certificate, 2]]));
      if (s.type === 'list') for (const i of s.items) out.push(entry('cv', i.name, '/about', s.title, [[s.title, 2], [i.detail, 2]]));
    }
  return out;
}

/** Every term has to match somewhere; matches at the start of a word and in titles count most. */
function score(e: Entry, terms: string[]): number {
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [text, weight] of e.fields) {
      const i = text.indexOf(term);
      if (i === -1) continue;
      const atWord = i === 0 || !/[\p{L}\p{N}]/u.test(text[i - 1]);
      best = Math.max(best, weight * (atWord ? 2 : 1));
    }
    if (!best) return 0;
    total += best;
  }
  return total;
}

/** Marks the first query term in a title. */
function mark(text: string, terms: string[]): ReactNode {
  const lower = text.toLowerCase();
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i === -1) continue;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-transparent text-accent">{text.slice(i, i + term.length)}</mark>
        {text.slice(i + term.length)}
      </>
    );
  }
  return text;
}

const KIND_LABEL: Record<Kind, MessageKey> = {
  pages: 'search.pages',
  skills: 'search.skills',
  knowhow: 'search.knowhow',
  projects: 'search.projects',
  articles: 'search.articles',
  cv: 'search.cv',
};

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const { content } = useContent();
  const index = useMemo(() => buildIndex(content), [content]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  const terms = useMemo(() => fold(query).split(/\s+/).filter(Boolean), [query]);
  const results = useMemo(() => {
    if (!terms.length) return index.filter((e) => e.kind === 'pages');
    return index
      .map((e) => ({ e, s: score(e, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map((r) => r.e);
  }, [index, terms]);

  useEffect(() => {
    const d = dialog.current!;
    d.showModal();
    return () => d.close();
  }, []);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (e: Entry | undefined) => {
    if (!e) return;
    onClose();
    navigate(e.url);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-label={t('search.title')}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself.
      onClick={(e) => e.target === dialog.current && onClose()}
      className="search-dialog m-0 mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-lg border border-line bg-bg p-0 font-mono text-fg shadow-warm"
    >
      <div className="flex items-center justify-between border-b border-line/60 px-4 py-2 text-xs text-muted">
        <span>
          <span className="text-accent">$</span> grep -ri
        </span>
        <kbd className="rounded-sm border border-line/70 px-1.5 py-0.5">esc</kbd>
      </div>
      <div className="flex items-center gap-2 border-b border-line/60 px-4">
        <span className="text-accent" aria-hidden="true">
          &gt;
        </span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('search.placeholder')}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-results`}
          aria-activedescendant={results.length ? `${id}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label={t('search.title')}
          spellCheck={false}
          className="min-h-12 w-full bg-transparent text-base text-fg placeholder:text-muted/70 focus:outline-none"
        />
      </div>
      <ul ref={list} id={`${id}-results`} role="listbox" aria-label={t('search.title')} className="max-h-[50vh] overflow-y-auto py-1">
        {results.map((r, i) => (
          <li
            key={`${r.kind}:${r.url}:${r.title}`}
            id={`${id}-${i}`}
            data-index={i}
            role="option"
            aria-selected={i === active}
            onPointerMove={() => setActive(i)}
            onClick={() => go(r)}
            className={`flex cursor-pointer items-baseline gap-2 px-4 py-2 text-sm ${i === active ? 'bg-line/30' : ''}`}
          >
            <span className={`w-3 shrink-0 text-accent ${i === active ? '' : 'invisible'}`} aria-hidden="true">
              &gt;
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{mark(r.title, terms)}</span>
              {r.detail ? <span className="block truncate text-xs text-muted">{r.detail}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-muted">{t(KIND_LABEL[r.kind])}</span>
          </li>
        ))}
      </ul>
      {!results.length ? (
        <p role="status" className="px-4 py-6 text-sm text-muted">
          {t('search.empty', { q: query })}
        </p>
      ) : null}
      <p className="hidden border-t border-line/60 px-4 py-2 text-xs text-muted sm:block">{t('search.hint')}</p>
    </dialog>
  );
}
