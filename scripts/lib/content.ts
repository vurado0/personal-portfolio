// Node adapter for the content core: reads /content and /public from disk and adds syntax
// highlighting. Used by the Vite plugin (virtual:content), validate-content and prerender.
import fs from 'node:fs';
import path from 'node:path';
import hljs from 'highlight.js';
import { buildContent, type FileMap } from '../../src/lib/content-core/build.ts';

export { STATIC_ROUTES, type Issue } from '../../src/lib/content-core/build.ts';

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const toPosix = (p: string) => p.split(path.sep).join('/');

export function readContentFiles(root: string): FileMap {
  const files: FileMap = {};
  for (const f of walk(path.join(root, 'content'))) {
    if (/\.(md|json)$/.test(f)) files[toPosix(path.relative(root, f))] = fs.readFileSync(f, 'utf8');
  }
  return files;
}

export function loadContent({ root, includeDrafts }: { root: string; includeDrafts: boolean }) {
  const publicDir = path.join(root, 'public');
  const publicFiles = new Set(walk(publicDir).map((f) => '/' + toPosix(path.relative(publicDir, f))));
  return buildContent(readContentFiles(root), {
    includeDrafts,
    publicFiles,
    highlight: (code, lang) => (hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : null),
  });
}
