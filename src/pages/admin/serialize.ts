// Reading/writing content files from the admin editor. Front matter is edited through the
// yaml Document API so existing formatting and comments survive where possible.
import { Document, parseDocument } from 'yaml';
import { splitFrontMatter } from '../../lib/content-core/build';

export type MdFile = { data: Record<string, unknown>; body: string };

export function readMd(src: string | undefined): MdFile {
  const parts = src ? splitFrontMatter(src) : null;
  if (!parts) return { data: {}, body: src ?? '' };
  return { data: (parseDocument(parts.yaml).toJS() ?? {}) as Record<string, unknown>, body: parts.body.replace(/^\n+/, '') };
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * Writes front matter + body. `order` lists the keys in the order they should appear in new files;
 * empty values in `optional` are removed instead of written.
 */
export function writeMd(existing: string | undefined, data: Record<string, unknown>, body: string, order: string[], optional: string[] = []): string {
  const parts = existing ? splitFrontMatter(existing) : null;
  const doc = parts ? parseDocument(parts.yaml) : new Document({});
  const keys = [...order, ...Object.keys(data).filter((k) => !order.includes(k))];
  for (const key of keys) {
    if (!(key in data)) continue;
    const value = data[key];
    if (optional.includes(key) && (isEmpty(value) || value === false)) {
      doc.delete(key);
    } else if (Array.isArray(value)) {
      doc.set(key, doc.createNode(value, { flow: true }));
    } else if (value && typeof value === 'object') {
      const clean = Object.fromEntries(Object.entries(value).filter(([, v]) => !isEmpty(v)));
      if (Object.keys(clean).length) doc.set(key, doc.createNode(clean));
      else doc.delete(key);
    } else {
      doc.set(key, value);
    }
  }
  const yaml = doc.toString({ lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n${body.trim()}\n`;
}

/** JSON with arrays of small objects written one object per line (diff-friendly, like the hand-written files). */
export function prettyJson(value: unknown): string {
  const inline = (v: unknown): string => {
    if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`;
    if (v && typeof v === 'object') {
      const entries = Object.entries(v).filter(([, x]) => x !== undefined);
      return entries.length ? `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }` : '{}';
    }
    return JSON.stringify(v);
  };
  const render = (v: unknown, indent: string): string => {
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]';
      const inner = indent + '  ';
      const items = v.map((x) => {
        const flat = inline(x);
        return x && typeof x === 'object' && !Array.isArray(x) && flat.length <= 240 ? flat : render(x, inner);
      });
      const oneLine = `[${items.join(', ')}]`;
      if (v.every((x) => typeof x !== 'object') && oneLine.length + indent.length <= 120) return oneLine;
      return `[\n${items.map((i) => inner + i).join(',\n')}\n${indent}]`;
    }
    if (v && typeof v === 'object') {
      const inner = indent + '  ';
      const entries = Object.entries(v).filter(([, x]) => x !== undefined);
      if (!entries.length) return '{}';
      return `{\n${entries.map(([k, x]) => `${inner}${JSON.stringify(k)}: ${render(x, inner)}`).join(',\n')}\n${indent}}`;
    }
    return JSON.stringify(v);
  };
  return render(value, '') + '\n';
}

export function readJsonFile<T>(src: string | undefined, fallback: T): T {
  try {
    return src ? (JSON.parse(src) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const today = () => new Date().toISOString().slice(0, 10);
