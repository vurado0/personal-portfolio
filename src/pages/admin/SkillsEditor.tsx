import { useState } from 'react';
import { SLUG_RE } from '../../lib/content-core/build';
import { levelLabel } from '../../lib/content';
import type { Skill, SkillGroup } from '../../types/content';
import { Actions, ErrorList, LevelPicker, SelectField, TextArea, TextField } from './ui';
import { prettyJson, readJsonFile, readMd, slugify, writeMd } from './serialize';
import { useWorkspace, type Workspace } from './workspace';

const SKILLS = 'content/skills.json';
const CERTS = 'content/certificates.json';

/** Files (and certificates) that reference a skill id. */
export function findReferences(files: Record<string, string>, id: string): string[] {
  const refs: string[] = [];
  for (const [path, src] of Object.entries(files)) {
    if (path.endsWith('.md') && (readMd(src).data.skills as string[] | undefined)?.includes(id)) refs.push(path);
  }
  const certs = readJsonFile<{ id: string; skills?: string[] }[]>(files[CERTS], []);
  certs.filter((c) => c.skills?.includes(id)).forEach((c) => refs.push(`${CERTS} (${c.id})`));
  return refs;
}

/** Deletes a skill (after confirmation) and removes it from every file that references it. */
export function deleteSkill(ws: Workspace, id: string, name: string): boolean {
  const refs = findReferences(ws.files, id);
  const msg = refs.length ? `"${name}" is used in ${refs.length} place(s):\n${refs.join('\n')}\n\nDelete it and remove it from all of them?` : `Delete "${name}"?`;
  if (!confirm(msg)) return false;
  const edits: Record<string, string> = {
    [SKILLS]: prettyJson({ groups: ws.groups, skills: ws.skills.filter((x) => x.id !== id) }),
  };
  for (const [path, src] of Object.entries(ws.files)) {
    if (!path.endsWith('.md')) continue;
    const { data, body } = readMd(src);
    const list = data.skills as string[] | undefined;
    if (list?.includes(id)) edits[path] = writeMd(src, { ...data, skills: list.filter((x) => x !== id) }, body, []);
  }
  const certs = readJsonFile<{ skills?: string[] }[]>(ws.files[CERTS], []);
  if (certs.some((c) => c.skills?.includes(id))) {
    edits[CERTS] = prettyJson(certs.map((c) => ({ ...c, skills: (c.skills ?? []).filter((x) => x !== id) })));
  }
  ws.write(edits);
  return true;
}

export function SkillForm({ skill, isNew, onDone }: { skill: Skill; isNew: boolean; onDone: () => void }) {
  const ws = useWorkspace();
  const [s, setS] = useState(skill);
  const [idTouched, setIdTouched] = useState(!isNew);
  const [errors, setErrors] = useState<string[]>([]);
  const set = (patch: Partial<Skill>) => setS((x) => ({ ...x, ...patch }));

  const save = () => {
    const e: string[] = [];
    if (!s.name.trim()) e.push('Name is required.');
    if (!SLUG_RE.test(s.id)) e.push('ID must be lowercase letters, numbers and dashes (e.g. "spring-boot").');
    if (isNew && ws.skills.some((x) => x.id === s.id)) e.push(`A skill with the id "${s.id}" already exists.`);
    if (!s.context.trim()) e.push('Context is required (one sentence about where you use it).');
    setErrors(e);
    if (e.length) return;
    const skills = isNew ? [...ws.skills, s] : ws.skills.map((x) => (x.id === skill.id ? s : x));
    ws.write({ [SKILLS]: prettyJson({ groups: ws.groups, skills }) });
    onDone();
  };

  const remove = () => {
    if (deleteSkill(ws, skill.id, skill.name)) onDone();
  };

  return (
    <div className="space-y-5">
      <h3 className="font-mono text-xl font-bold">{isNew ? 'New skill' : `Edit ${skill.name}`}</h3>
      <TextField
        label="name"
        required
        value={s.name}
        onChange={(name) => set(idTouched ? { name } : { name, id: slugify(name) })}
        placeholder="Spring Boot"
      />
      <TextField
        label="id"
        value={s.id}
        onChange={(id) => {
          setIdTouched(true);
          set({ id });
        }}
        disabled={!isNew}
        hint={isNew ? 'Used to link projects and articles to this skill — cannot be changed later.' : 'IDs are stable and cannot be changed.'}
      />
      <SelectField label="group" value={s.group} onChange={(group) => set({ group })} options={ws.groups.map((g) => ({ value: g.id, label: g.label }))} />
      <LevelPicker value={s.level} onChange={(level) => set({ level })} />
      <TextArea label="context *" value={s.context} onChange={(context) => set({ context })} placeholder="Where and how you use it" />
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} onDelete={isNew ? undefined : remove} saveLabel={isNew ? 'Add skill' : 'Save'} />
    </div>
  );
}

export function GroupsForm({ onDone }: { onDone: () => void }) {
  const ws = useWorkspace();
  const [groups, setGroups] = useState<SkillGroup[]>(ws.groups);
  const [newLabel, setNewLabel] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const used = (id: string) => ws.skills.some((s) => s.group === id);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[i], next[j]] = [next[j], next[i]];
    setGroups(next);
  };
  const save = () => {
    const e = groups.filter((g) => !g.label.trim()).map((g) => `Group "${g.id}" needs a label.`);
    setErrors(e);
    if (e.length) return;
    ws.write({ [SKILLS]: prettyJson({ groups, skills: ws.skills }) });
    onDone();
  };
  return (
    <div className="space-y-5">
      <h3 className="font-mono text-xl font-bold">Skill groups</h3>
      <ul className="space-y-2">
        {groups.map((g, i) => (
          <li key={g.id} className="flex items-center gap-2">
            <input value={g.label} onChange={(e) => setGroups(groups.map((x) => (x.id === g.id ? { ...x, label: e.target.value } : x)))} className="input flex-1" aria-label={`Label for ${g.id}`} />
            <button type="button" className="chip min-h-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              ↑
            </button>
            <button type="button" className="chip min-h-9" onClick={() => move(i, 1)} disabled={i === groups.length - 1} aria-label="Move down">
              ↓
            </button>
            <button
              type="button"
              className="chip min-h-9"
              disabled={used(g.id)}
              title={used(g.id) ? 'Move or delete its skills first' : 'Delete group'}
              onClick={() => setGroups(groups.filter((x) => x.id !== g.id))}
              aria-label="Delete group"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="New group, e.g. Databases" className="input flex-1" />
        <button
          type="button"
          className="btn-ghost"
          disabled={!slugify(newLabel) || groups.some((g) => g.id === slugify(newLabel))}
          onClick={() => {
            setGroups([...groups, { id: slugify(newLabel), label: newLabel.trim() }]);
            setNewLabel('');
          }}
        >
          Add
        </button>
      </div>
      <ErrorList errors={errors} />
      <Actions onSave={save} onCancel={onDone} />
    </div>
  );
}

export function SkillsEditor() {
  const ws = useWorkspace();
  const [editing, setEditing] = useState<{ skill: Skill; isNew: boolean } | 'groups' | null>(null);

  if (editing === 'groups') return <GroupsForm onDone={() => setEditing(null)} />;
  if (editing) return <SkillForm key={editing.skill.id} skill={editing.skill} isNew={editing.isNew} onDone={() => setEditing(null)} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEditing({ isNew: true, skill: { id: '', name: '', group: ws.groups[0]?.id ?? '', level: 3, context: '' } })}
          disabled={!ws.groups.length}
        >
          + New skill
        </button>
        <button type="button" className="btn-ghost" onClick={() => setEditing('groups')}>
          Edit groups
        </button>
      </div>
      {ws.groups.map((g) => {
        const list = ws.skills.filter((s) => s.group === g.id);
        return (
          <section key={g.id}>
            <h3 className="section-title">
              {g.label} ({list.length})
            </h3>
            <ul className="mt-2 divide-y divide-line/50">
              {list.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setEditing({ skill: s, isNew: false })} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left hover:text-accent">
                    <span>
                      <span className="font-bold">{s.name}</span> <span className="font-mono text-xs text-muted">#{s.id}</span>
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {s.level}/5 {levelLabel(s.level)}
                    </span>
                  </button>
                </li>
              ))}
              {!list.length && <li className="py-2 text-sm text-muted">No skills in this group.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
