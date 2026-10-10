// Loads and validates everything in /content. Used by the Vite plugin (virtual:content),
// scripts/validate-content.ts and scripts/prerender.ts, so all three see the same data.
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { renderMarkdown } from './markdown.ts';
import type {
  ArticleDoc,
  Certificate,
  ContentBundle,
  Cv,
  Difficulty,
  Hobby,
  KnowhowDoc,
  ProjectDoc,
  ProjectStatus,
  Skill,
  SkillGroup,
} from '../../src/types/content.ts';

export type Issue = { level: 'error' | 'warn'; file: string; message: string };

export type LoadOptions = {
  root: string;
  /** Include `draft: true` articles (dev only). */
  includeDrafts: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG_RE = /^[a-z0-9][a-z0-9+#.-]*$/;
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'in progress', 'done'];

/** Static routes that markdown may link to (besides generated doc/skill pages). */
export const STATIC_ROUTES = [
  '/',
  '/skills',
  '/knowhow',
  '/projects',
  '/blog',
  '/blog/articles',
  '/hobbies',
  '/about',
  '/certificates',
  '/contact',
  '/impressum',
  '/datenschutz',
];

type Raw = { file: string; data: Record<string, unknown>; body: string };

function isValidDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.md') ? [p] : [];
  });
}

function readJson<T>(file: string, issues: Issue[], fallback: T): T {
  if (!fs.existsSync(file)) {
    file = path.basename(file);
    issues.push({ level: 'error', file, message: 'file is missing' });
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch (e) {
    issues.push({ level: 'error', file, message: `invalid JSON: ${(e as Error).message}` });
    return fallback;
  }
}

function readMarkdown(file: string, issues: Issue[], root: string): Raw | null {
  const rel = path.relative(root, file);
  const src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src);
  if (!m) {
    issues.push({ level: 'error', file: rel, message: 'missing front matter (--- ... ---)' });
    return null;
  }
  try {
    const data = (parseYaml(m[1]) ?? {}) as Record<string, unknown>;
    return { file, data, body: m[2] };
  } catch (e) {
    issues.push({ level: 'error', file: rel, message: `invalid front matter: ${(e as Error).message.split('\n')[0]}` });
    return null;
  }
}

class Checker {
  constructor(
    private issues: Issue[],
    private file: string,
    private data: Record<string, unknown>,
  ) {}
  err(message: string) {
    this.issues.push({ level: 'error', file: this.file, message });
  }
  str(key: string, required = true): string {
    const v = this.data[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
    if (required) this.err(`"${key}" is required and must be a non-empty string`);
    return '';
  }
  date(key: string): string {
    const v = this.data[key];
    if (!isValidDate(v)) {
      this.err(`"${key}" must be a valid date (YYYY-MM-DD), got ${JSON.stringify(v)}`);
      return '1970-01-01';
    }
    return v;
  }
  list(key: string, opts: { required?: boolean; pattern?: RegExp } = {}): string[] {
    const v = this.data[key];
    if (v === undefined || v === null) {
      if (opts.required) this.err(`"${key}" is required (list)`);
      return [];
    }
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
      this.err(`"${key}" must be a list of strings`);
      return [];
    }
    if (opts.pattern) {
      for (const x of v) if (!opts.pattern.test(x)) this.err(`"${key}" entry "${x}" is invalid (lowercase, no spaces)`);
    }
    return v as string[];
  }
  bool(key: string, fallback: boolean): boolean {
    const v = this.data[key];
    if (v === undefined) return fallback;
    if (typeof v !== 'boolean') this.err(`"${key}" must be true or false`);
    return v === true;
  }
  oneOf<T extends string>(key: string, values: T[]): T {
    const v = this.data[key];
    if (typeof v !== 'string' || !values.includes(v as T)) {
      this.err(`"${key}" must be one of ${values.map((x) => `"${x}"`).join(', ')}`);
      return values[0];
    }
    return v as T;
  }
}

function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

export function loadContent({ root, includeDrafts }: LoadOptions): { bundle: ContentBundle; issues: Issue[] } {
  const issues: Issue[] = [];
  const contentDir = path.join(root, 'content');
  const publicDir = path.join(root, 'public');
  const rel = (f: string) => path.relative(root, f);
  const allLinks: { file: string; href: string }[] = [];

  // ---- Skills -------------------------------------------------------------
  const skillsFile = path.join(contentDir, 'skills.json');
  const skillsJson = readJson<{ groups: SkillGroup[]; skills: Skill[] }>(skillsFile, issues, { groups: [], skills: [] });
  const skillGroups = skillsJson.groups ?? [];
  const skills = skillsJson.skills ?? [];
  const groupIds = new Set(skillGroups.map((g) => g.id));
  const skillIds = new Set<string>();
  for (const s of skills) {
    const where = `skill "${s.id}"`;
    if (!s.id || !SLUG_RE.test(s.id)) issues.push({ level: 'error', file: rel(skillsFile), message: `${where}: id must be lowercase-kebab` });
    if (skillIds.has(s.id)) issues.push({ level: 'error', file: rel(skillsFile), message: `${where}: duplicate id` });
    skillIds.add(s.id);
    if (!s.name) issues.push({ level: 'error', file: rel(skillsFile), message: `${where}: name is required` });
    if (!groupIds.has(s.group)) issues.push({ level: 'error', file: rel(skillsFile), message: `${where}: unknown group "${s.group}"` });
    if (!Number.isInteger(s.level) || s.level < 1 || s.level > 5)
      issues.push({ level: 'error', file: rel(skillsFile), message: `${where}: level must be an integer 1–5` });
  }
  const checkSkills = (file: string, ids: string[]) => {
    for (const id of ids)
      if (!skillIds.has(id)) issues.push({ level: 'error', file, message: `unknown skill id "${id}" (define it in content/skills.json)` });
  };

  // ---- Know-how -----------------------------------------------------------
  const knowhow: KnowhowDoc[] = [];
  for (const file of walk(path.join(contentDir, 'knowhow'))) {
    const raw = readMarkdown(file, issues, root);
    if (!raw) continue;
    const r = rel(file);
    const c = new Checker(issues, r, raw.data);
    const folder = path.basename(path.dirname(file));
    const slug = path.basename(file, '.md');
    if (!SLUG_RE.test(slug)) c.err(`file name "${slug}" must be lowercase-kebab`);
    const category = c.str('category');
    if (category && category !== folder) c.err(`category "${category}" must match folder "${folder}"`);
    const md = renderMarkdown(raw.body);
    const skillList = c.list('skills', { required: true, pattern: SLUG_RE });
    checkSkills(r, skillList);
    md.links.forEach((href) => allLinks.push({ file: r, href }));
    knowhow.push({
      slug,
      url: `/knowhow/${folder}/${slug}`,
      title: c.str('title'),
      summary: c.str('summary'),
      category: folder,
      tags: c.list('tags', { required: true, pattern: TAG_RE }),
      skills: skillList,
      updated: c.date('updated'),
      difficulty: c.oneOf('difficulty', DIFFICULTIES),
      html: md.html,
      headings: md.headings,
      text: md.text,
      readingMinutes: readingMinutes(md.text),
    });
  }
  knowhow.sort((a, b) => b.updated.localeCompare(a.updated));

  // ---- Projects -----------------------------------------------------------
  const projects: ProjectDoc[] = [];
  for (const file of walk(path.join(contentDir, 'projects'))) {
    const raw = readMarkdown(file, issues, root);
    if (!raw) continue;
    const r = rel(file);
    const c = new Checker(issues, r, raw.data);
    const slug = path.basename(file, '.md');
    if (!SLUG_RE.test(slug)) c.err(`file name "${slug}" must be lowercase-kebab`);
    const md = renderMarkdown(raw.body);
    const skillList = c.list('skills', { required: true, pattern: SLUG_RE });
    checkSkills(r, skillList);
    md.links.forEach((href) => allLinks.push({ file: r, href }));
    const links = (raw.data.links ?? {}) as ProjectDoc['links'];
    if (typeof links !== 'object' || Array.isArray(links)) c.err('"links" must be a map, e.g. { github: https://... }');
    const cover = c.str('cover', false) || undefined;
    if (cover) allLinks.push({ file: r, href: cover });
    projects.push({
      slug,
      url: `/projects/${slug}`,
      title: c.str('title'),
      summary: c.str('summary'),
      tags: c.list('tags', { pattern: TAG_RE }),
      stack: c.list('stack', { required: true }),
      skills: skillList,
      role: c.str('role'),
      status: c.oneOf('status', PROJECT_STATUSES),
      period: c.str('period'),
      links,
      cover,
      featured: c.bool('featured', false),
      html: md.html,
      headings: md.headings,
      text: md.text,
      readingMinutes: readingMinutes(md.text),
    });
  }
  projects.sort((a, b) => Number(b.featured) - Number(a.featured) || b.period.localeCompare(a.period));

  // ---- Blog articles ------------------------------------------------------
  const articles: ArticleDoc[] = [];
  for (const file of walk(path.join(contentDir, 'blog'))) {
    const raw = readMarkdown(file, issues, root);
    if (!raw) continue;
    const r = rel(file);
    const c = new Checker(issues, r, raw.data);
    const base = path.basename(file, '.md');
    const m = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(base);
    if (!m) {
      c.err('file name must be <yyyy-mm-dd>-<slug>.md');
      continue;
    }
    const [, fileDate, slug] = m;
    if (!SLUG_RE.test(slug)) c.err(`slug "${slug}" must be lowercase-kebab`);
    const date = c.date('date');
    if (date !== fileDate) c.err(`front matter date ${date} does not match file name date ${fileDate}`);
    const draft = c.bool('draft', false);
    const md = renderMarkdown(raw.body);
    const skillList = c.list('skills', { pattern: SLUG_RE });
    checkSkills(r, skillList);
    md.links.forEach((href) => allLinks.push({ file: r, href }));
    const cover = c.str('cover', false) || undefined;
    if (cover) allLinks.push({ file: r, href: cover });
    const doc: ArticleDoc = {
      slug,
      url: `/blog/articles/${slug}`,
      title: c.str('title'),
      summary: c.str('summary'),
      date,
      tags: c.list('tags', { required: true, pattern: TAG_RE }),
      skills: skillList,
      cover,
      draft,
      html: md.html,
      headings: md.headings,
      text: md.text,
      readingMinutes: readingMinutes(md.text),
    };
    if (!draft || includeDrafts) articles.push(doc);
  }
  articles.sort((a, b) => b.date.localeCompare(a.date));

  // ---- JSON collections ---------------------------------------------------
  const hobbiesFile = path.join(contentDir, 'hobbies.json');
  const hobbies = readJson<Hobby[]>(hobbiesFile, issues, []);
  for (const h of hobbies) {
    if (!h.id || !h.title || !h.text) issues.push({ level: 'error', file: rel(hobbiesFile), message: `hobby "${h.id}": id, title and text are required` });
    if (h.image) allLinks.push({ file: rel(hobbiesFile), href: h.image });
  }

  const cvFile = path.join(contentDir, 'cv.json');
  const cv = readJson<Cv>(cvFile, issues, { summary: '', timeline: [], languages: [] });
  for (const t of cv.timeline ?? []) {
    if (!t.title || !t.org || !/^\d{4}(-\d{2})?$/.test(t.start))
      issues.push({ level: 'error', file: rel(cvFile), message: `timeline "${t.title}": title, org and start (YYYY or YYYY-MM) are required` });
  }
  if (cv.pdf) allLinks.push({ file: rel(cvFile), href: cv.pdf });

  const certFile = path.join(contentDir, 'certificates.json');
  const certificates = readJson<Certificate[]>(certFile, issues, []);
  for (const cert of certificates) {
    if (!cert.id || !cert.title || !cert.issuer)
      issues.push({ level: 'error', file: rel(certFile), message: `certificate "${cert.id}": id, title and issuer are required` });
    if (!['planned', 'in progress', 'done'].includes(cert.status))
      issues.push({ level: 'error', file: rel(certFile), message: `certificate "${cert.id}": invalid status "${cert.status}"` });
    checkSkills(rel(certFile), cert.skills ?? []);
  }

  // ---- Unique slugs -------------------------------------------------------
  const seen = new Map<string, string>();
  for (const d of [...knowhow, ...projects, ...articles]) {
    if (seen.has(d.url)) issues.push({ level: 'error', file: d.url, message: `duplicate URL (also used by ${seen.get(d.url)})` });
    seen.set(d.url, d.title);
  }
  const articleSlugs = new Set<string>();
  for (const a of articles) {
    if (articleSlugs.has(a.slug)) issues.push({ level: 'error', file: a.url, message: 'duplicate article slug' });
    articleSlugs.add(a.slug);
  }

  // ---- Internal links -----------------------------------------------------
  const valid = new Set([
    ...STATIC_ROUTES,
    ...knowhow.map((d) => d.url),
    ...knowhow.map((d) => `/knowhow/${d.category}`),
    ...projects.map((d) => d.url),
    ...articles.map((d) => d.url),
    ...skills.map((s) => `/skills/${s.id}`),
  ]);
  for (const { file, href } of allLinks) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
    if (valid.has(clean)) continue;
    if (fs.existsSync(path.join(publicDir, clean))) continue;
    issues.push({ level: 'error', file, message: `broken internal link "${href}"` });
  }

  return {
    bundle: { skillGroups, skills, knowhow, projects, articles, hobbies, cv, certificates },
    issues,
  };
}
