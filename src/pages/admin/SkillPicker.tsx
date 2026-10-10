import { useState } from 'react';
import { content } from '../../lib/content';
import type { Skill, SkillGroup } from '../../types/content';

export function SkillPicker({ value, onChange, groups = content.skillGroups, skills = content.skills }: { value: string[]; onChange: (v: string[]) => void; groups?: SkillGroup[]; skills?: Skill[] }) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const names = value.map((id) => skills.find((s) => s.id === id)?.name ?? `${id} (unknown)`);
  return (
    <div>
      <button type="button" className="label underline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        skills ({value.length}) {open ? '▴' : '▾'}
      </button>
      {!open && names.length > 0 ? <p className="mt-1 text-sm text-muted">{names.join(', ')}</p> : null}
      {open && (
        <div className="mt-2 space-y-3">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="mb-1 text-xs text-muted">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills
                  .filter((s) => s.group === g.id)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-pressed={value.includes(s.id)}
                      className={`chip min-h-9 ${value.includes(s.id) ? 'border-accent bg-accent text-on-accent' : 'text-fg'}`}
                    >
                      {s.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
