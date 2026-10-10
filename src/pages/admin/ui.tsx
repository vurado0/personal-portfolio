// Small, phone-friendly form building blocks for the admin area.
export { SkillPicker } from './SkillPicker';
import { useMemo, useState, type ReactNode } from 'react';
import { Markdown } from '../../components/Markdown';
import { renderMarkdown } from '../../lib/content-core/markdown';

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

type TextProps = { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; placeholder?: string; type?: string; disabled?: boolean; required?: boolean };

export function TextField({ label, value, onChange, hint, placeholder, type = 'text', disabled, required }: TextProps) {
  return (
    <Field label={label + (required ? ' *' : '')} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input disabled:opacity-60"
        autoCapitalize={type === 'url' || type === 'email' ? 'none' : undefined}
      />
    </Field>
  );
}

export function TextArea({ label, value, onChange, hint, rows = 3, placeholder }: Omit<TextProps, 'type'> & { rows?: number }) {
  return (
    <Field label={label} hint={hint}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="input" />
    </Field>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: readonly (T | { value: T; label: string })[] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="input">
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

/** Comma-separated list input ("docker, linux"). */
export function ListField({ label, value, onChange, hint, placeholder, lowercase }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: ReactNode; placeholder?: string; lowercase?: boolean }) {
  const [text, setText] = useState(value.join(', '));
  return (
    <Field label={label} hint={hint ?? 'comma separated'}>
      <input
        value={text}
        placeholder={placeholder}
        autoCapitalize="none"
        className="input"
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split(',')
              .map((x) => (lowercase ? x.trim().toLowerCase().replace(/\s+/g, '-') : x.trim()))
              .filter(Boolean),
          );
        }}
      />
    </Field>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--crema))]" />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function LevelPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Field label="level (1 = just started, 5 = expert)">
      <div className="flex gap-1.5" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} className={`btn min-w-11 border ${n <= value ? 'border-accent bg-accent text-on-accent' : 'border-line text-fg'}`}>
            {n}
          </button>
        ))}
      </div>
    </Field>
  );
}

/** Markdown textarea with a rendered preview tab. */
export function MarkdownField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const html = useMemo(() => (tab === 'preview' ? renderMarkdown(value).html : ''), [tab, value]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label">body (markdown)</span>
        <div className="flex gap-1">
          {(['write', 'preview'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={`chip min-h-9 ${tab === t ? 'border-accent text-accent' : 'text-muted'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === 'write' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={16} className="input font-mono text-sm leading-6" spellCheck />
      ) : (
        <div className="min-h-40 rounded-md border border-line p-4">
          <Markdown html={html} className="prose-sm" />
        </div>
      )}
      <p className="mt-1 text-xs text-muted">
        ## Heading · **bold** · [link](/skills/docker) · ```bash code``` · ![alt](/images/…)
      </p>
    </div>
  );
}

/** Generic editor for a list of objects: collapsible rows with move / delete. */
export function RowsEditor<T>({
  items,
  onChange,
  create,
  title,
  render,
  addLabel = 'Add',
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  title: (item: T) => string;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  addLabel?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const update = (i: number, patch: Partial<T>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(open === i ? j : open);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-md border border-line/70">
          <div className="flex items-center gap-1 pr-1">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} className="min-h-11 flex-1 truncate px-3 text-left text-sm" aria-expanded={open === i}>
              <span className="mr-2 text-accent">{open === i ? '▾' : '▸'}</span>
              {title(item) || <span className="text-muted">(empty)</span>}
            </button>
            <button type="button" className="chip min-h-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              ↑
            </button>
            <button type="button" className="chip min-h-9" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
              ↓
            </button>
            <button
              type="button"
              className="chip min-h-9"
              onClick={() => {
                if (confirm(`Remove "${title(item) || 'this entry'}"?`)) {
                  onChange(items.filter((_, j) => j !== i));
                  setOpen(null);
                }
              }}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
          {open === i ? <div className="space-y-4 border-t border-line/60 p-3">{render(item, (patch) => update(i, patch))}</div> : null}
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost w-full"
        onClick={() => {
          onChange([...items, create()]);
          setOpen(items.length);
        }}
      >
        + {addLabel}
      </button>
    </div>
  );
}

export function Actions({ onSave, onCancel, onDelete, saveLabel = 'Save', dirty = true }: { onSave: () => void; onCancel?: () => void; onDelete?: () => void; saveLabel?: string; dirty?: boolean }) {
  return (
    <div className="sticky bottom-16 z-10 -mx-4 flex flex-wrap gap-2 border-t border-line/60 bg-bg/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={onSave} disabled={!dirty}>
        {saveLabel}
      </button>
      {onCancel ? (
        <button type="button" className="btn-ghost flex-1 sm:flex-none" onClick={onCancel}>
          Cancel
        </button>
      ) : null}
      {onDelete ? (
        <button type="button" className="btn-ghost sm:ml-auto" onClick={onDelete}>
          Delete
        </button>
      ) : null}
    </div>
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <ul role="alert" className="space-y-1 rounded-md border border-accent px-3 py-2 text-sm">
      {errors.map((e) => (
        <li key={e}>• {e}</li>
      ))}
    </ul>
  );
}

/** Textarea editing a list, one entry per line (keeps its own text so typing feels natural). */
export function LinesField({ label, value, onChange, hint, rows = 3, toText = (v) => v, fromText = (v) => v }: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: ReactNode;
  rows?: number;
  toText?: (v: string) => string;
  fromText?: (line: string) => string | null;
}) {
  const [text, setText] = useState(value.map(toText).join('\n'));
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={text}
        rows={rows}
        className="input"
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .map(fromText)
              .filter((x): x is string => x !== null),
          );
        }}
      />
    </Field>
  );
}
