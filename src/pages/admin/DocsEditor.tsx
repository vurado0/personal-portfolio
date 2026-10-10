// One editor for the three Markdown collections: projects, know-how articles and blog articles.
import { useMemo, useState } from 'react';
import { DATE_RE, SLUG_RE } from '../../lib/content-core/build';
import { categoryLabel } from '../../lib/content';
import { Actions, ErrorList, ListField, MarkdownField, SelectField, SkillPicker, TextArea, TextField, Toggle } from './ui';
import { readMd, slugify, today, writeMd } from './serialize';
import { useWorkspace } from './workspace';

export type DocKind = 'projects' | 'knowhow' | 'articles';

type Doc = {
  path: string | null; // null = not saved yet
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  skills: string[];
  body: string;
  // projects
  stack: string[];
  role: string;
  status: 'idea' | 'in progress' | 'done';
  period: string;
  github: string;
  demo: string;
  cover: string;
  featured: boolean;
  // know-how
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  updated: string;
  // articles
  date: string;
  draft: boolean;
};

const TEMPLATES: Record<DocKind, string> = {
  projects: '## Problem\n\nWhat problem does it solve?\n\n## Solution\n\nHow does it work?\n\n## Lessons learned\n\n- …\n',
  knowhow: '## Overview\n\nWhat this is about.\n\n## Steps\n\n```bash\n# commands\n```\n',
  articles: 'Write your article here.\n',
};

const ORDER: Record<DocKind, string[]> = {
  projects: ['title', 'summary', 'stack', 'skills', 'tags', 'role', 'status', 'period', 'links', 'cover', 'featured'],
  knowhow: ['title', 'category', 'tags', 'skills', 'summary', 'updated', 'difficulty'],
  articles: ['title', 'date', 'tags', 'skills', 'summary', 'cover', 'draft'],
};
const OPTIONAL = ['cover', 'tags', 'featured', 'draft', 'links'];

const str = (v: unknown) => (typeof v === 'number' ? String(v) : typeof v === 'string' ? v : '');
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

function toDoc(kind: DocKind, path: string, src: string): Doc {
  const { data, body } = readMd(src);
  const file = path.slice(path.lastIndexOf('/') + 1, -3);
  const links = (data.links ?? {}) as Record<string, unknown>;
  return {
    path,
    slug: kind === 'articles' ? file.slice(11) : file,
    title: str(data.title),
    summary: str(data.summary),
    tags: list(data.tags),
    skills: list(data.skills),
    body,
    stack: list(data.stack),
    role: str(data.role),
    status: (str(data.status) || 'idea') as Doc['status'],
    period: str(data.period),
    github: str(links.github),
    demo: str(links.demo),
    cover: str(data.cover),
    featured: data.featured === true,
    category: kind === 'knowhow' ? path.split('/')[2] : '',
    difficulty: (str(data.difficulty) || 'beginner') as Doc['difficulty'],
    updated: str(data.updated),
    date: str(data.date),
    draft: data.draft === true,
  };
}

function emptyDoc(kind: DocKind, category: string): Doc {
  return {
    path: null,
    slug: '',
    title: '',
    summary: '',
    tags: [],
    skills: [],
    body: TEMPLATES[kind],
    stack: [],
    role: '',
    status: 'in progress',
    period: String(new Date().getFullYear()),
    github: '',
    demo: '',
    cover: '',
    featured: false,
    category,
    difficulty: 'beginner',
    updated: today(),
    date: today(),
    draft: true,
  };
}

function pathFor(kind: DocKind, d: Doc): string {
  if (kind === 'projects') return `content/projects/${d.slug}.md`;
  if (kind === 'knowhow') return `content/knowhow/${d.category}/${d.slug}.md`;
  return `content/blog/${d.date}-${d.slug}.md`;
}

function frontMatter(kind: DocKind, d: Doc): Record<string, unknown> {
  const base = { title: d.title.trim(), summary: d.summary.trim(), tags: d.tags, skills: d.skills };
  if (kind === 'projects')
    return { ...base, stack: d.stack, role: d.role.trim(), status: d.status, period: d.period.trim(), links: { github: d.github.trim(), demo: d.demo.trim() }, cover: d.cover.trim(), featured: d.featured };
  if (kind === 'knowhow') return { ...base, category: d.category, updated: d.updated, difficulty: d.difficulty };
  return { ...base, date: d.date, cover: d.cover.trim(), draft: d.draft };
}

function validate(kind: DocKind, d: Doc, existingPaths: Set<string>): string[] {
  const e: string[] = [];
  if (!d.title.trim()) e.push('Title is required.');
  if (!d.summary.trim()) e.push('Summary is required.');
  if (!SLUG_RE.test(d.slug)) e.push('Slug must be lowercase letters, numbers and dashes.');
  if (kind !== 'projects' && !d.tags.length) e.push('Add at least one tag.');
  if (kind !== 'articles' && !d.skills.length) e.push('Pick at least one skill.');
  if (kind === 'projects') {
    if (!d.stack.length) e.push('Stack is required.');
    if (!d.role.trim()) e.push('Role is required.');
    if (!d.period.trim()) e.push('Period is required (e.g. 2026).');
  }
  if (kind === 'knowhow') {
    if (!SLUG_RE.test(d.category)) e.push('Category must be lowercase (e.g. "linux").');
    if (!DATE_RE.test(d.updated)) e.push('Updated must be a date.');
  }
  if (kind === 'articles' && !DATE_RE.test(d.date)) e.push('Date is required.');
  const target = pathFor(kind, d);
  if (target !== d.path && existingPaths.has(target)) e.push(`${target} already exists — choose another slug.`);
  return e;
}

function DocForm({ kind, doc, onDone }: { kind: DocKind; doc: Doc; onDone: () => void }) {
  const ws = useWorkspace();
  const [d, setD] = useState(doc);
  const [slugTouched, setSlugTouched] = useState(doc.path !== null);
  const [newCategory, setNewCategory] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<Doc>) => setD((x) => ({ ...x, ...patch }));
  const isNew = d.path === null;
  const categories = useMemo(
    () => [...new Set(Object.keys(ws.files).filter((p) => p.startsWith('content/knowhow/')).map((p) => p.split('/')[2]))].sort(),
    [ws.files],
  );

  const save = () => {
    const doc2 = kind === 'knowhow' && newCategory ? { ...d, category: slugify(newCategory) } : d;
    const e = validate(kind, doc2, new Set(Object.keys(ws.files)));
    setErrors(e);
    if (e.length) return;
    const target = pathFor(kind, doc2);
    const src = writeMd(doc.path ? ws.files[doc.path] : undefined, frontMatter(kind, doc2), doc2.body, ORDER[kind], OPTIONAL);
    ws.write({ ...(doc.path && doc.path !== target ? { [doc.path]: null } : {}), [target]: src });
    onDone();
  };

  const remove = () => {
    if (doc.path && confirm(`Delete "${doc.title}"? (Links to it from other pages will fail validation.)`)) {
      ws.write({ [doc.path]: null });
      onDone();
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="font-mono text-xl font-bold">{isNew ? 'New' : 'Edit'}: {d.title || 'untitled'}</h3>
      <TextField label="title" required value={d.title} onChange={(title) => set(slugTouched ? { title } : { title, slug: slugify(title) })} />
      <TextField
        label="slug"
        value={d.slug}
        onChange={(slug) => {
          setSlugTouched(true);
          set({ slug });
        }}
        disabled={!isNew}
        hint={isNew ? 'Part of the URL — cannot be changed later.' : 'Slugs are stable (they are URLs).'}
      />
      <TextArea label="summary *" value={d.summary} onChange={(summary) => set({ summary })} rows={2} />

      {kind === 'knowhow' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="category"
            value={newCategory ? '__new' : d.category}
            onChange={(v) => (v === '__new' ? setNewCategory(' ') : (setNewCategory(''), set({ category: v })))}
            options={[...categories.map((c) => ({ value: c, label: categoryLabel(c) })), { value: '__new', label: '+ new category…' }]}
          />
          {newCategory ? <TextField label="new category" value={newCategory.trim()} onChange={(v) => setNewCategory(v || ' ')} placeholder="networking" /> : null}
          <SelectField label="difficulty" value={d.difficulty} onChange={(difficulty) => set({ difficulty })} options={['beginner', 'intermediate', 'advanced'] as const} />
          <TextField label="updated" type="date" value={d.updated} onChange={(updated) => set({ updated })} hint={<button type="button" className="underline" onClick={() => set({ updated: today() })}>set to today</button>} />
        </div>
      )}

      {kind === 'projects' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="status" value={d.status} onChange={(status) => set({ status })} options={['idea', 'in progress', 'done'] as const} />
          <TextField label="period" required value={d.period} onChange={(period) => set({ period })} placeholder="2025 – 2026" />
          <TextField label="role" required value={d.role} onChange={(role) => set({ role })} placeholder="Solo developer" />
          <ListField label="stack *" value={d.stack} onChange={(stack) => set({ stack })} placeholder="React, Docker, PostgreSQL" />
          <TextField label="github link" type="url" value={d.github} onChange={(github) => set({ github })} placeholder="https://github.com/…" />
          <TextField label="live demo link" type="url" value={d.demo} onChange={(demo) => set({ demo })} placeholder="https://…" />
          <Toggle label="Featured on the home page" checked={d.featured} onChange={(featured) => set({ featured })} />
        </div>
      )}

      {kind === 'articles' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="date" type="date" value={d.date} onChange={(date) => set({ date })} hint="Changing the date renames the file (and its URL stays the same)." />
          <Toggle label="Draft (not visible on the live site)" checked={d.draft} onChange={(draft) => set({ draft })} />
        </div>
      )}

      {kind !== 'knowhow' && <TextField label="cover image" value={d.cover} onChange={(cover) => set({ cover })} placeholder="/images/… or https://res.cloudinary.com/…" hint="Optional. A file in public/ or a full image URL." />}
      <ListField label={kind === 'projects' ? 'tags' : 'tags *'} value={d.tags} onChange={(tags) => set({ tags })} placeholder="docker, networking" lowercase />
      <SkillPicker value={d.skills} onChange={(skills) => set({ skills })} groups={ws.groups} skills={ws.skills} />
      <MarkdownField value={d.body} onChange={(body) => set({ body })} />
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} onDelete={isNew ? undefined : remove} saveLabel={isNew ? 'Create' : 'Save'} />
    </div>
  );
}

const DIRS: Record<DocKind, string> = { projects: 'content/projects/', knowhow: 'content/knowhow/', articles: 'content/blog/' };

export function DocsEditor({ kind }: { kind: DocKind }) {
  const ws = useWorkspace();
  const [editing, setEditing] = useState<Doc | null>(null);
  const docs = useMemo(
    () =>
      Object.entries(ws.files)
        .filter(([p]) => p.startsWith(DIRS[kind]) && p.endsWith('.md'))
        .map(([p, src]) => toDoc(kind, p, src))
        .sort((a, b) => (kind === 'articles' ? b.date.localeCompare(a.date) : kind === 'knowhow' ? a.category.localeCompare(b.category) || a.title.localeCompare(b.title) : a.title.localeCompare(b.title))),
    [ws.files, kind],
  );
  const changed = new Set(ws.changes.map((c) => c.path));

  if (editing) return <DocForm key={editing.path ?? 'new'} kind={kind} doc={editing} onDone={() => setEditing(null)} />;

  const firstCategory = docs.find((x) => x.category)?.category ?? 'linux';
  return (
    <div className="space-y-4">
      <button type="button" className="btn-primary" onClick={() => setEditing(emptyDoc(kind, firstCategory))}>
        + New {kind === 'projects' ? 'project' : kind === 'knowhow' ? 'know-how article' : 'article'}
      </button>
      <ul className="divide-y divide-line/50">
        {docs.map((d) => (
          <li key={d.path}>
            <button type="button" onClick={() => setEditing(d)} className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left hover:text-accent">
              <span className="min-w-0">
                <span className="block truncate font-bold">{d.title || d.slug}</span>
                <span className="block truncate font-mono text-xs text-muted">
                  {kind === 'projects' ? `${d.status} · ${d.period}${d.featured ? ' · featured' : ''}` : kind === 'knowhow' ? `${categoryLabel(d.category)} · updated ${d.updated}` : `${d.date}${d.draft ? ' · draft' : ''}`}
                </span>
              </span>
              {changed.has(d.path!) ? <span className="chip flex-none border-accent text-accent">edited</span> : null}
            </button>
          </li>
        ))}
        {!docs.length && <li className="py-3 text-sm text-muted">Nothing here yet.</li>}
      </ul>
    </div>
  );
}
