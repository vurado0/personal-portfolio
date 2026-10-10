// Single-item forms used by edit mode (drawer on the public pages) and by Admin → Content.
import { useState } from 'react';
import { buildNav, NAV_DEFAULTS } from '../../config/navigation';
import {
  CEFR_LEVELS,
  type Certificate,
  type Cv,
  type CvEntry,
  type CvLanguage,
  type CvListItem,
  type CvPersonal,
  type CvSection,
  type CvSectionType,
  type Hobby,
  type NavEntry,
  type PageText,
} from '../../types/content';
import { Actions, ErrorList, Field, LinesField, SelectField, SkillPicker, TextArea, TextField, Toggle } from './ui';
import { prettyJson, readJsonFile, slugify } from './serialize';
import { uploadCvPdf } from './contentApi';
import { useWorkspace } from './workspace';

export const CERTS = 'content/certificates.json';
export const HOBBIES = 'content/hobbies.json';
export const CV = 'content/cv.json';
export const NAV = 'content/navigation.json';

const uniqueId = (base: string, taken: Set<string>) => {
  let id = slugify(base) || 'item';
  for (let n = 2; taken.has(id); n++) id = `${slugify(base) || 'item'}-${n}`;
  return id;
};

function Title({ children }: { children: string }) {
  return <h3 className="font-mono text-xl font-bold">{children}</h3>;
}

// ---- Certificates -----------------------------------------------------------

export function CertificateForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const ws = useWorkspace();
  const all = readJsonFile<Certificate[]>(ws.files[CERTS], []);
  const existing = all.find((c) => c.id === id);
  const [c, setC] = useState<Certificate>(existing ?? { id: '', title: '', issuer: '', status: 'planned', skills: [] });
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<Certificate>) => setC((x) => ({ ...x, ...patch }));
  const save = () => {
    const e: string[] = [];
    if (!c.title.trim()) e.push('Title is required.');
    if (!c.issuer.trim()) e.push('Issuer is required.');
    setErrors(e);
    if (e.length) return;
    const item: Certificate = { ...c, id: existing ? c.id : uniqueId(c.title, new Set(all.map((x) => x.id))), date: c.date || undefined, url: c.url || undefined };
    ws.write({ [CERTS]: prettyJson(existing ? all.map((x) => (x.id === id ? item : x)) : [...all, item]) });
    onDone();
  };
  return (
    <div className="space-y-5">
      <Title>{existing ? `Edit ${existing.title}` : 'New certificate'}</Title>
      <TextField label="title" required value={c.title} onChange={(title) => set({ title })} placeholder="AWS Certified Cloud Practitioner" />
      <TextField label="issuer" required value={c.issuer} onChange={(issuer) => set({ issuer })} placeholder="Amazon Web Services" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="status" value={c.status} onChange={(status) => set({ status })} options={['planned', 'in progress', 'done'] as const} />
        <TextField label={c.status === 'done' ? 'earned on' : 'target date'} type="date" value={c.date ?? ''} onChange={(date) => set({ date })} />
      </div>
      <TextField label="link (badge / credential)" type="url" value={c.url ?? ''} onChange={(url) => set({ url })} />
      <SkillPicker value={c.skills ?? []} onChange={(skills) => set({ skills })} groups={ws.groups} skills={ws.skills} />
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} saveLabel={existing ? 'Save' : 'Add certificate'} />
    </div>
  );
}

// ---- Hobbies -----------------------------------------------------------------

export function HobbyForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const ws = useWorkspace();
  const all = readJsonFile<Hobby[]>(ws.files[HOBBIES], []);
  const existing = all.find((h) => h.id === id);
  const [h, setH] = useState<Hobby>(existing ?? { id: '', title: '', text: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<Hobby>) => setH((x) => ({ ...x, ...patch }));
  const save = () => {
    const e: string[] = [];
    if (!h.title.trim()) e.push('Title is required.');
    if (!h.text.trim()) e.push('Text is required.');
    setErrors(e);
    if (e.length) return;
    const item: Hobby = { ...h, id: existing ? h.id : uniqueId(h.title, new Set(all.map((x) => x.id))), image: h.image || undefined, links: h.links?.length ? h.links : undefined };
    ws.write({ [HOBBIES]: prettyJson(existing ? all.map((x) => (x.id === id ? item : x)) : [...all, item]) });
    onDone();
  };
  return (
    <div className="space-y-5">
      <Title>{existing ? `Edit ${existing.title}` : 'New hobby'}</Title>
      <TextField label="title" required value={h.title} onChange={(title) => set({ title })} placeholder="Filmmaking" />
      <TextArea label="text *" value={h.text} onChange={(text) => set({ text })} rows={4} />
      <TextField label="image" value={h.image ?? ''} onChange={(image) => set({ image })} placeholder="/images/… or https://…" />
      <LinesField
        label="links (one per line: Label | https://…)"
        value={(h.links ?? []).map((l) => `${l.label} | ${l.url}`)}
        onChange={(lines) =>
          set({
            links: lines
              .map((line) => line.split('|').map((x) => x.trim()))
              .filter(([label, url]) => label && url)
              .map(([label, url]) => ({ label, url })),
          })
        }
        rows={2}
      />
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} saveLabel={existing ? 'Save' : 'Add hobby'} />
    </div>
  );
}

// ---- Menu --------------------------------------------------------------------

export function NavEditor({ onDone }: { onDone?: () => void }) {
  const ws = useWorkspace();
  const [items, setItems] = useState<NavEntry[]>(() =>
    buildNav(readJsonFile<NavEntry[]>(ws.files[NAV], [])).map(({ id, label, enabled }) => ({ id, label, enabled })),
  );
  const [saved, setSaved] = useState(false);
  const paths = new Map(NAV_DEFAULTS.map((d) => [d.id, d.path]));
  const update = (i: number, patch: Partial<NavEntry>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const save = () => {
    ws.write({ [NAV]: prettyJson(items.map((x) => ({ ...x, label: x.label.trim() || NAV_DEFAULTS.find((d) => d.id === x.id)!.label }))) });
    setSaved(true);
    onDone?.();
  };
  return (
    <div className="space-y-5">
      <Title>Menu</Title>
      <p className="text-sm text-muted">Rename, reorder and show/hide pages. Hidden pages disappear from the menu and the site after publishing.</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className={`flex items-center gap-2 rounded-md border border-line/60 p-2 ${!it.enabled ? 'opacity-60' : ''}`}>
            <label className="flex min-h-11 items-center" title={it.id === 'home' ? 'Home is always visible' : it.enabled ? 'Visible' : 'Hidden'}>
              <input
                type="checkbox"
                checked={it.enabled}
                disabled={it.id === 'home'}
                onChange={(e) => update(i, { enabled: e.target.checked })}
                className="h-5 w-5 accent-[rgb(var(--crema))]"
                aria-label={`Show ${it.label} in the menu`}
              />
            </label>
            <div className="min-w-0 flex-1">
              <input value={it.label} onChange={(e) => update(i, { label: e.target.value })} className="input py-1.5" aria-label={`Label for ${paths.get(it.id)}`} />
              <p className="mt-0.5 font-mono text-[11px] text-muted">{paths.get(it.id)}</p>
            </div>
            <button type="button" className="chip min-h-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              ↑
            </button>
            <button type="button" className="chip min-h-9" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
              ↓
            </button>
          </li>
        ))}
      </ul>
      {saved && !onDone ? (
        <p role="status" className="font-mono text-sm text-accent">
          ✓ Saved — publish to make it live.
        </p>
      ) : null}
      <Actions onSave={save} onCancel={onDone} />
    </div>
  );
}

// ---- CV ----------------------------------------------------------------------

const emptyPersonal = (): CvPersonal => ({
  fullName: '',
  headline: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  linkedin: '',
  github: '',
  nationality: '',
  dateOfBirth: '',
  drivingLicence: '',
  photo: '',
});

export function readCv(files: Record<string, string>): Cv {
  const cv = readJsonFile<Cv>(files[CV], { personal: emptyPersonal(), summary: '', sections: [] });
  return { ...cv, personal: { ...emptyPersonal(), ...cv.personal }, sections: cv.sections ?? [] };
}

export function CvPersonalForm({ onDone }: { onDone: () => void }) {
  const ws = useWorkspace();
  const cv = readCv(ws.files);
  const [p, setP] = useState<CvPersonal>(cv.personal);
  const [summary, setSummary] = useState(cv.summary);
  const [pdf, setPdf] = useState(cv.pdf ?? '');
  const set = (patch: Partial<CvPersonal>) => setP((x) => ({ ...x, ...patch }));
  const field = (key: keyof CvPersonal, label: string, extra: { type?: string; placeholder?: string; hint?: string } = {}) => (
    <TextField label={label} value={p[key]} onChange={(v) => set({ [key]: v } as Partial<CvPersonal>)} {...extra} />
  );
  const save = () => {
    ws.write({ [CV]: prettyJson({ ...cv, personal: p, summary, pdf: pdf || undefined }) });
    onDone();
  };
  return (
    <div className="space-y-5">
      <Title>Personal information</Title>
      <p className="rounded-md border border-line/60 px-3 py-2 text-xs text-muted">Everything you fill in here is public on the website. Leave a field empty to hide it (e.g. phone, date of birth).</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('fullName', 'full name', { placeholder: 'Kaito Snezhko' })}
        {field('headline', 'headline / job title', { placeholder: 'IT student & developer' })}
        {field('email', 'email', { type: 'email' })}
        {field('phone', 'phone', { type: 'tel', placeholder: '+43 …' })}
        {field('address', 'address / city', { placeholder: 'Graz, Austria' })}
        {field('nationality', 'nationality')}
        {field('dateOfBirth', 'date of birth', { type: 'date' })}
        {field('drivingLicence', 'driving licence', { placeholder: 'B' })}
        {field('website', 'website', { type: 'url' })}
        {field('linkedin', 'LinkedIn', { type: 'url' })}
        {field('github', 'GitHub', { type: 'url' })}
        {field('photo', 'photo', { placeholder: '/images/me.jpg or https://…' })}
      </div>
      <TextArea label="profile / about me" value={summary} onChange={setSummary} rows={4} hint="Short professional summary at the top of the CV." />
      <TextField label="cv pdf" value={pdf} onChange={setPdf} hint="Path of a PDF in public/ (e.g. /cv.pdf). Empty = no download button." />
      <Actions onSave={save} onCancel={onDone} />
    </div>
  );
}

const MAX_PDF = 3_000_000;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });

/** Uploads a new public/cv.pdf straight to GitHub (its own commit, goes live after the deploy). */
export function CvPdfForm({ onDone, onUploaded }: { onDone: () => void; onUploaded: (p: { sha: string; url: string }) => void }) {
  const ws = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = ws.changes.length;
  const current = readCv(ws.files).pdf;

  const upload = async () => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError('Please choose a PDF file.');
    if (file.size > MAX_PDF) return setError(`The PDF is ${(file.size / 1e6).toFixed(1)} MB — the limit is 3 MB.`);
    setBusy(true);
    setError('');
    try {
      const r = await uploadCvPdf(ws.headSha, await toBase64(file));
      onUploaded({ sha: r.commitSha, url: r.commitUrl });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Title>Upload CV (PDF)</Title>
      <p className="text-sm text-muted">
        Replaces the PDF behind the “Download CV” button{current ? <> (currently <a href={current} target="_blank" rel="noopener noreferrer">{current}</a>)</> : null}. It is live about a minute after the upload, once the site has redeployed. Max. 3 MB.
      </p>
      {pending ? (
        <p className="rounded-md border border-accent/60 px-3 py-2 text-sm">You have {pending} unpublished change(s). Publish or discard them first, then upload the PDF.</p>
      ) : null}
      <Field label="pdf file">
        <input type="file" accept="application/pdf,.pdf" className="input" disabled={busy || pending > 0} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>
      <ErrorList errors={error ? [error] : []} />
      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={!file || busy || pending > 0} onClick={upload}>
          {busy ? 'Uploading…' : '⇪ Upload'}
        </button>
        <button type="button" className="btn-ghost" onClick={onDone} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const SECTION_TYPES: { value: CvSectionType; label: string }[] = [
  { value: 'timeline', label: 'Timeline (jobs, education, volunteering…)' },
  { value: 'languages', label: 'Languages (CEFR levels)' },
  { value: 'list', label: 'List (skills, awards, interests…)' },
  { value: 'text', label: 'Free text' },
];

/** Europass sections you can add with one click. */
const PRESETS: { title: string; type: CvSectionType }[] = [
  { title: 'Work experience', type: 'timeline' },
  { title: 'Education and training', type: 'timeline' },
  { title: 'Language skills', type: 'languages' },
  { title: 'Digital skills', type: 'list' },
  { title: 'Certifications', type: 'timeline' },
  { title: 'Projects', type: 'timeline' },
  { title: 'Volunteering', type: 'timeline' },
  { title: 'Honours and awards', type: 'list' },
  { title: 'Publications', type: 'list' },
  { title: 'Conferences and seminars', type: 'timeline' },
  { title: 'Communication and interpersonal skills', type: 'text' },
  { title: 'Organisational skills', type: 'text' },
  { title: 'Hobbies and interests', type: 'list' },
  { title: 'References', type: 'list' },
];

function newSection(id: string, title: string, type: CvSectionType): CvSection {
  const base = { id, title, visible: true };
  if (type === 'timeline') return { ...base, type, items: [] };
  if (type === 'languages') return { ...base, type, motherTongues: [], items: [] };
  if (type === 'list') return { ...base, type, items: [] };
  return { ...base, type, text: '' };
}

export function CvSectionForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const ws = useWorkspace();
  const cv = readCv(ws.files);
  const existing = cv.sections.find((s) => s.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [type, setType] = useState<CvSectionType>(existing?.type ?? 'timeline');
  const [visible, setVisible] = useState(existing?.visible ?? true);
  const [text, setText] = useState(existing?.type === 'text' ? existing.text : '');
  const [mother, setMother] = useState<string[]>(existing?.type === 'languages' ? existing.motherTongues : []);
  const [errors, setErrors] = useState<string[]>([]);
  const taken = new Set(cv.sections.map((s) => s.id));
  const presets = PRESETS.filter((p) => !cv.sections.some((s) => s.title.toLowerCase() === p.title.toLowerCase()));

  const save = () => {
    if (!title.trim()) return setErrors(['Title is required.']);
    let section: CvSection = existing ?? newSection(uniqueId(title, taken), title.trim(), type);
    section = { ...section, title: title.trim(), visible };
    if (section.type === 'text') section = { ...section, text };
    if (section.type === 'languages') section = { ...section, motherTongues: mother };
    ws.write({ [CV]: prettyJson({ ...cv, sections: existing ? cv.sections.map((s) => (s.id === id ? section : s)) : [...cv.sections, section] }) });
    onDone();
  };

  return (
    <div className="space-y-5">
      <Title>{existing ? `Section: ${existing.title}` : 'New CV section'}</Title>
      {!existing && presets.length > 0 && (
        <Field label="europass sections">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.title}
                type="button"
                className={`chip min-h-9 ${title === p.title ? 'border-accent bg-accent text-on-accent' : 'text-fg'}`}
                onClick={() => {
                  setTitle(p.title);
                  setType(p.type);
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </Field>
      )}
      <TextField label="title" required value={title} onChange={setTitle} placeholder="Work experience" />
      {existing ? (
        <p className="text-sm text-muted">Type: {SECTION_TYPES.find((t) => t.value === existing.type)?.label}</p>
      ) : (
        <SelectField label="type" value={type} onChange={setType} options={SECTION_TYPES} />
      )}
      <Toggle label="Visible on the website" checked={visible} onChange={setVisible} />
      {(existing?.type ?? type) === 'text' && <TextArea label="text" value={text} onChange={setText} rows={6} />}
      {(existing?.type ?? type) === 'languages' && <LinesField label="mother tongue(s), one per line" value={mother} onChange={setMother} rows={2} />}
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} saveLabel={existing ? 'Save' : 'Add section'} />
    </div>
  );
}

const emptyLanguage = (): CvLanguage => ({ name: '', listening: 'B1', reading: 'B1', spokenInteraction: 'B1', spokenProduction: 'B1', writing: 'B1' });

export function CvEntryForm({ section: sectionId, index, onDone }: { section: string; index?: number; onDone: () => void }) {
  const ws = useWorkspace();
  const cv = readCv(ws.files);
  const section = cv.sections.find((s) => s.id === sectionId);
  const items: unknown[] = section && section.type !== 'text' ? section.items : [];
  const existing = index !== undefined ? items[index] : undefined;
  const [item, setItem] = useState<Record<string, string>>((): Record<string, string> => {
    if (existing) return { ...(existing as Record<string, string>) };
    if (section?.type === 'languages') return { ...(emptyLanguage() as Record<string, string>) };
    if (section?.type === 'list') return { name: '' };
    return { title: '', org: '', start: String(new Date().getFullYear()) };
  });
  const [errors, setErrors] = useState<string[]>([]);
  if (!section || section.type === 'text') return <p>Section not found.</p>;
  const set = (key: string) => (v: string) => setItem((x) => ({ ...x, [key]: v }));

  const save = () => {
    const e: string[] = [];
    if (section.type === 'timeline') {
      if (!item.title?.trim()) e.push('Title is required.');
      if (!item.org?.trim()) e.push('Organisation is required.');
      if (!/^\d{4}(-\d{2})?$/.test(item.start ?? '')) e.push('Start must be YYYY or YYYY-MM.');
      if (item.end && !/^\d{4}(-\d{2})?$/.test(item.end)) e.push('End must be YYYY or YYYY-MM (or empty for "now").');
    } else if (!item.name?.trim()) e.push('Name is required.');
    setErrors(e);
    if (e.length) return;
    const clean = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== '' && v !== undefined));
    const next = index !== undefined ? items.map((x, i) => (i === index ? clean : x)) : [...items, clean];
    ws.write({ [CV]: prettyJson({ ...cv, sections: cv.sections.map((s) => (s.id === sectionId ? ({ ...s, items: next } as CvSection) : s)) }) });
    onDone();
  };

  return (
    <div className="space-y-5">
      <Title>{`${existing ? 'Edit' : 'Add'} · ${section.title}`}</Title>
      {section.type === 'timeline' && (
        <>
          <TextField label="title / role / degree" required value={item.title ?? ''} onChange={set('title')} placeholder="Junior DevOps Engineer" />
          <TextField label="organisation / employer / school" required value={item.org ?? ''} onChange={set('org')} />
          <TextField label="location" value={item.location ?? ''} onChange={set('location')} placeholder="Graz, Austria" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="from" required value={item.start ?? ''} onChange={set('start')} placeholder="2024-10" />
            <TextField label="to" value={item.end ?? ''} onChange={set('end')} placeholder="empty = ongoing" />
          </div>
          <TextArea label="description / main activities" value={item.text ?? ''} onChange={set('text')} rows={4} />
          <TextField label="link" type="url" value={item.link ?? ''} onChange={set('link')} placeholder="https://…" />
        </>
      )}
      {section.type === 'languages' && (
        <>
          <TextField label="language" required value={item.name ?? ''} onChange={set('name')} placeholder="English" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ['listening', 'listening'],
                ['reading', 'reading'],
                ['spokenProduction', 'spoken production'],
                ['spokenInteraction', 'spoken interaction'],
                ['writing', 'writing'],
              ] as const
            ).map(([key, label]) => (
              <SelectField key={key} label={label} value={(item[key] ?? 'B1') as (typeof CEFR_LEVELS)[number]} onChange={set(key)} options={CEFR_LEVELS} />
            ))}
          </div>
          <TextField label="certificate (optional)" value={item.certificate ?? ''} onChange={set('certificate')} placeholder="Cambridge C1 Advanced" />
        </>
      )}
      {section.type === 'list' && (
        <>
          <TextField label="name" required value={item.name ?? ''} onChange={set('name')} />
          <TextField label="level (optional)" value={item.level ?? ''} onChange={set('level')} placeholder="advanced" />
          <TextArea label="detail (optional)" value={item.detail ?? ''} onChange={set('detail')} rows={2} />
        </>
      )}
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} saveLabel={existing ? 'Save' : 'Add'} />
    </div>
  );
}

/** Admin → Content → CV: overview with the same forms as edit mode. */
export function CvOverview() {
  const ws = useWorkspace();
  const cv = readCv(ws.files);
  const [form, setForm] = useState<{ kind: 'personal' } | { kind: 'section'; id?: string } | { kind: 'entry'; section: string; index?: number } | null>(null);
  const close = () => setForm(null);
  if (form?.kind === 'personal') return <CvPersonalForm onDone={close} />;
  if (form?.kind === 'section') return <CvSectionForm id={form.id} onDone={close} />;
  if (form?.kind === 'entry') return <CvEntryForm section={form.section} index={form.index} onDone={close} />;

  const label = (s: CvSection, x: unknown) =>
    s.type === 'timeline' ? `${(x as CvEntry).start} · ${(x as CvEntry).title}` : (x as CvListItem | CvLanguage).name;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Tip: you can edit the CV directly on the <a href="/about">About / CV</a> page too.
      </p>
      <button type="button" className="btn-ghost w-full justify-start" onClick={() => setForm({ kind: 'personal' })}>
        ✎ Personal information & profile text
      </button>
      {cv.sections.map((s) => (
        <section key={s.id} className={`rounded-md border border-line/60 p-3 ${!s.visible ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono font-bold">
              {s.title} {!s.visible ? <span className="text-xs font-normal text-muted">(hidden)</span> : null}
            </h3>
            <button type="button" className="chip min-h-9" onClick={() => setForm({ kind: 'section', id: s.id })}>
              ✎ section
            </button>
          </div>
          {s.type !== 'text' && (
            <ul className="mt-2 space-y-1">
              {s.items.map((x, i) => (
                <li key={i}>
                  <button type="button" className="min-h-9 w-full truncate text-left text-sm hover:text-accent" onClick={() => setForm({ kind: 'entry', section: s.id, index: i })}>
                    ✎ {label(s, x)}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="chip mt-1 min-h-9" onClick={() => setForm({ kind: 'entry', section: s.id })}>
                  + add
                </button>
              </li>
            </ul>
          )}
        </section>
      ))}
      <button type="button" className="btn-ghost w-full" onClick={() => setForm({ kind: 'section' })}>
        + Add CV section
      </button>
    </div>
  );
}

// ---- Page texts ----------------------------------------------------------------

export const PAGES = 'content/pages.json';

/** Pages with the editorial (blog-style) header use meta lines instead of a "// label". */
const EDITORIAL_PAGES = new Set(['blog', 'hobbies']);

export function PageTextForm({ id, onDone }: { id: string; onDone: () => void }) {
  const ws = useWorkspace();
  const all = readJsonFile<Record<string, PageText>>(ws.files[PAGES], {});
  const [page, setPage] = useState<PageText>(all[id] ?? { title: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const editorial = EDITORIAL_PAGES.has(id);
  const set = (patch: Partial<PageText>) => setPage((p) => ({ ...p, ...patch }));
  const save = () => {
    if (!page.title.trim()) return setErrors(['Title is required.']);
    const clean: PageText = { ...page, title: page.title.trim(), meta: page.meta?.filter((m) => m.label.trim()) };
    if (!clean.meta?.length) delete clean.meta;
    ws.write({ [PAGES]: prettyJson({ ...all, [id]: clean }) });
    onDone();
  };
  return (
    <div className="space-y-5">
      <Title>{`Page text · ${id}`}</Title>
      {!editorial && <TextField label="small label above the title" value={page.label ?? ''} onChange={(label) => set({ label })} placeholder={id} />}
      <TextField label="title" required value={page.title} onChange={(title) => set({ title })} />
      <TextArea label="intro text" value={page.intro ?? ''} onChange={(intro) => set({ intro })} rows={3} hint="Empty = no intro." />
      {editorial && (
        <LinesField
          label="meta lines (one per line: Label | Value)"
          value={(page.meta ?? []).map((m) => `${m.label} | ${m.value}`)}
          onChange={(lines) =>
            set({
              meta: lines.map((line) => {
                const [label, ...rest] = line.split('|');
                return { label: label.trim().replace(/:$/, ''), value: rest.join('|').trim() };
              }),
            })
          }
          rows={3}
          hint="Shown left of the title, e.g. “Blog | Personal”."
        />
      )}
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} />
    </div>
  );
}
