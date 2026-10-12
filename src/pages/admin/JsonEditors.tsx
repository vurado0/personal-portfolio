// Whole-file editors for the JSON content files: profile, certificates and hobbies.
import { useState } from 'react';
import type { Certificate, Hobby, Profile } from '../../types/content';
import { Actions, ErrorList, Field, LinesField, RowsEditor, SelectField, SkillPicker, TextArea, TextField } from './ui';
import { prettyJson, readJsonFile, slugify } from './serialize';
import { useWorkspace } from './workspace';

/** Loads a JSON file into local state; Save writes it back into the workspace draft. */
function useJsonFile<T>(path: string, fallback: T) {
  const ws = useWorkspace();
  const original = ws.files[path];
  const [value, setValue] = useState<T>(() => readJsonFile(original, fallback));
  const [saved, setSaved] = useState(false);
  const dirty = prettyJson(value) !== (original ?? '');
  const save = (v: T = value) => {
    ws.write({ [path]: prettyJson(v) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const reset = () => setValue(readJsonFile(original, fallback));
  return { value, setValue, save, reset, dirty, saved };
}

function SavedNote({ saved }: { saved: boolean }) {
  return saved ? (
    <p role="status" className="font-mono text-sm text-accent">
      ✓ Saved — publish to make it live.
    </p>
  ) : null;
}

// ---- Profile ---------------------------------------------------------------

export function ProfileEditor({ onDone }: { onDone?: () => void } = {}) {
  const f = useJsonFile<Profile>('content/profile.json', {
    name: '',
    handle: '',
    role: '',
    tagline: '',
    description: '',
    location: '',
    email: '',
    currentFocus: [],
    socials: [],
  });
  const p = f.value;
  const set = (patch: Partial<Profile>) => f.setValue({ ...p, ...patch });
  const [errors, setErrors] = useState<string[]>([]);
  const save = () => {
    const e: string[] = [];
    if (!p.name.trim()) e.push('Name is required.');
    if (!p.role.trim()) e.push('Role is required.');
    if (!/^\S+@\S+\.\S+$/.test(p.email)) e.push('Email looks invalid.');
    p.socials.forEach((s) => !/^(https?:|mailto:)/.test(s.url) && e.push(`Link "${s.label}" must start with https:// or mailto:`));
    setErrors(e);
    if (!e.length) {
      f.save();
      onDone?.();
    }
  };
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Shown on the home page, in the header, footer, page titles and the legal pages.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="name" required value={p.name} onChange={(name) => set({ name })} placeholder="Kaito …" />
        <TextField label="site title (browser tab)" value={p.siteTitle ?? ''} onChange={(siteTitle) => set({ siteTitle: siteTitle || undefined })} placeholder="Kaito Tech" />
        <TextField label="handle (logo)" value={p.handle} onChange={(handle) => set({ handle })} hint="Shown as ~/handle in the header." />
        <TextField label="role" required value={p.role} onChange={(role) => set({ role })} placeholder="IT student & developer" />
        <TextField label="location" value={p.location} onChange={(location) => set({ location })} placeholder="Graz, Austria" />
        <TextField label="email" type="email" required value={p.email} onChange={(email) => set({ email })} />
        <TextField label="photo (home page)" value={p.photo ?? ''} onChange={(photo) => set({ photo: photo || undefined })} placeholder="/images/me.webp or https://…" />
      </div>
      <TextArea
        label="postal address (Impressum, Datenschutz)"
        value={p.legalAddress ?? ''}
        onChange={(legalAddress) => set({ legalAddress: legalAddress || undefined })}
        rows={2}
        hint="Required by Austrian law for the Impressum. One line per address line."
      />
      <TextField label="tagline" value={p.tagline} onChange={(tagline) => set({ tagline })} hint="One line on the home page." />
      <TextArea label="description" value={p.description} onChange={(description) => set({ description })} rows={2} hint="Used for search engines and link previews." />
      <LinesField label="current focus (one per line)" value={p.currentFocus} onChange={(currentFocus) => set({ currentFocus })} rows={4} />
      <Field label="links (header, footer, contact)">
        <RowsEditor
          items={p.socials}
          onChange={(socials) => set({ socials })}
          create={() => ({ id: '', label: '', url: 'https://' })}
          title={(s) => s.label}
          addLabel="Add link"
          render={(s, update) => (
            <>
              <TextField label="label" value={s.label} onChange={(label) => update({ label, id: slugify(label) })} placeholder="GitHub" />
              <TextField label="url" type="url" value={s.url} onChange={(url) => update({ url })} />
            </>
          )}
        />
      </Field>
      <ErrorList errors={errors} />
      <SavedNote saved={f.saved} />
      <Actions onSave={save} onCancel={f.dirty ? f.reset : undefined} dirty={f.dirty} />
    </div>
  );
}

// ---- Certificates ----------------------------------------------------------

export function CertificatesEditor() {
  const ws = useWorkspace();
  const f = useJsonFile<Certificate[]>('content/certificates.json', []);
  const [errors, setErrors] = useState<string[]>([]);
  const save = () => {
    const ids = new Set<string>();
    const e: string[] = [];
    for (const c of f.value) {
      if (!c.title.trim() || !c.issuer.trim()) e.push(`"${c.title || '(untitled)'}": title and issuer are required.`);
      if (ids.has(c.id)) e.push(`Duplicate certificate "${c.title}".`);
      ids.add(c.id);
    }
    setErrors(e);
    if (!e.length) f.save(f.value.map((c) => ({ ...c, date: c.date || undefined, url: c.url || undefined })));
  };
  return (
    <div className="space-y-5">
      <RowsEditor<Certificate>
        items={f.value}
        onChange={f.setValue}
        create={() => ({ id: '', title: '', issuer: '', status: 'planned', skills: [] })}
        title={(c) => `${c.title} · ${c.status}`}
        addLabel="Add certificate"
        render={(c, update) => (
          <>
            <TextField label="title" required value={c.title} onChange={(title) => update(c.id && c.title ? { title } : { title, id: slugify(title) })} />
            <TextField label="issuer" required value={c.issuer} onChange={(issuer) => update({ issuer })} placeholder="Cisco Networking Academy" />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="status" value={c.status} onChange={(status) => update({ status })} options={['planned', 'in progress', 'done'] as const} />
              <TextField label={c.status === 'done' ? 'earned on' : 'target date'} type="date" value={c.date ?? ''} onChange={(date) => update({ date })} />
            </div>
            <TextField label="link (badge / credential)" type="url" value={c.url ?? ''} onChange={(url) => update({ url })} />
            <SkillPicker value={c.skills ?? []} onChange={(skills) => update({ skills })} groups={ws.groups} skills={ws.skills} />
          </>
        )}
      />
      <ErrorList errors={errors} />
      <SavedNote saved={f.saved} />
      <Actions onSave={save} onCancel={f.dirty ? f.reset : undefined} dirty={f.dirty} />
    </div>
  );
}

// ---- Hobbies ---------------------------------------------------------------

const linkToLine = (l: { label: string; url: string }) => `${l.label} | ${l.url}`;
const lineToLink = (line: string) => {
  const [label, url] = line.split('|').map((x) => x.trim());
  return label && url ? { label, url } : null;
};

export function HobbiesEditor() {
  const f = useJsonFile<Hobby[]>('content/hobbies.json', []);
  const [errors, setErrors] = useState<string[]>([]);
  const save = () => {
    const e = f.value.filter((h) => !h.title.trim() || !h.text.trim()).map((h) => `"${h.title || '(untitled)'}": title and text are required.`);
    setErrors(e);
    if (!e.length) f.save(f.value.map((h) => ({ ...h, image: h.image || undefined, links: h.links?.length ? h.links : undefined })));
  };
  return (
    <div className="space-y-5">
      <RowsEditor<Hobby>
        items={f.value}
        onChange={f.setValue}
        create={() => ({ id: '', title: '', text: '' })}
        title={(h) => h.title}
        addLabel="Add hobby"
        render={(h, update) => (
          <>
            <TextField label="title" required value={h.title} onChange={(title) => update({ title, id: h.id || slugify(title) })} placeholder="Filmmaking" />
            <TextArea label="text *" value={h.text} onChange={(text) => update({ text })} rows={3} />
            <TextField label="image" value={h.image ?? ''} onChange={(image) => update({ image })} placeholder="/images/hobbies/film.jpg or https://…" />
            <LinesField
              label="links (one per line: Label | https://…)"
              value={(h.links ?? []).map(linkToLine)}
              onChange={(lines) => update({ links: lines.map(lineToLink).filter((l): l is { label: string; url: string } => l !== null) })}
              rows={2}
            />
          </>
        )}
      />
      <ErrorList errors={errors} />
      <SavedNote saved={f.saved} />
      <Actions onSave={save} onCancel={f.dirty ? f.reset : undefined} dirty={f.dirty} />
    </div>
  );
}
