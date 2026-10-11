// Builds and validates the ContentBundle from a map of repo files ("content/skills.json" → text).
// Pure (no Node APIs): used at build time via scripts/lib/content.ts and in the browser by the
// admin content editor, so both enforce exactly the same rules before anything is published.
import { parse as parseYaml } from 'yaml';
import { renderMarkdown, type Highlighter } from './markdown.ts';
import type {
  ArticleDoc,
  Certificate,
  ContentBundle,
  Cv,
  Difficulty,
  Hobby,
  KnowhowDoc,
  NavEntry,
  PageText,
  Profile,
  ProjectDoc,
  ProjectStatus,
  Skill,
  SkillGroup,
  Translations,
} from '../../types/content.ts';
import { TRANSLATION_LOCALES } from '../../types/content.ts';
import { NAV_DEFAULTS } from '../../config/navigation.ts';

export type Issue = { level: 'error' | 'warn'; file: string; message: string };

export type BuildOptions = {
  /** Include `draft: true` articles (dev only). */
  includeDrafts: boolean;
  /** Files in public/, as site paths ("/cv.pdf") — used to check links to static files. */
  publicFiles: Set<string>;
  highlight?: Highlighter;
};

/** Repo-relative path → file content. */
export type FileMap = Record<string, string>;

const CV_DATE_RE = /^\d{4}(-\d{2})?$/;
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const emptyPersonal = () => ({
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

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TAG_RE = /^[a-z0-9][a-z0-9+#.-]*$/;
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

function mdFiles(files: FileMap, dir: string): string[] {
  return Object.keys(files)
    .filter((f) => f.startsWith(dir + '/') && f.endsWith('.md'))
    .sort();
}

const basename = (f: string, ext = '') => {
  const b = f.slice(f.lastIndexOf('/') + 1);
  return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b;
};
const parentName = (f: string) => basename(f.slice(0, f.lastIndexOf('/')));

function readJson<T>(files: FileMap, file: string, issues: Issue[], fallback: T): T {
  if (!(file in files)) {
    issues.push({ level: 'error', file, message: 'file is missing' });
    return fallback;
  }
  try {
    return JSON.parse(files[file]) as T;
  } catch (e) {
    issues.push({ level: 'error', file, message: `invalid JSON: ${(e as Error).message}` });
    return fallback;
  }
}

/** Splits "---\nyaml\n---\nbody". */
export function splitFrontMatter(src: string): { yaml: string; body: string } | null {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src.replace(/\r\n/g, '\n'));
  return m ? { yaml: m[1], body: m[2] } : null;
}

function readMarkdown(files: FileMap, file: string, issues: Issue[]): Raw | null {
  const parts = splitFrontMatter(files[file]);
  if (!parts) {
    issues.push({ level: 'error', file, message: 'missing front matter (--- ... ---)' });
    return null;
  }
  try {
    const data = (parseYaml(parts.yaml) ?? {}) as Record<string, unknown>;
    return { file, data, body: parts.body };
  } catch (e) {
    issues.push({ level: 'error', file, message: `invalid front matter: ${(e as Error).message.split('\n')[0]}` });
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

export function buildContent(files: FileMap, { includeDrafts, publicFiles, highlight }: BuildOptions): { bundle: ContentBundle; issues: Issue[] } {
  const issues: Issue[] = [];
  const render = (md: string) => renderMarkdown(md, highlight);
  const allLinks: { file: string; href: string }[] = [];

  // ---- Skills -------------------------------------------------------------
  const skillsFile = 'content/skills.json';
  const skillsJson = readJson<{ groups: SkillGroup[]; skills: Skill[] }>(files, skillsFile, issues, { groups: [], skills: [] });
  const skillGroups = skillsJson.groups ?? [];
  const skills = skillsJson.skills ?? [];
  const groupIds = new Set(skillGroups.map((g) => g.id));
  const skillIds = new Set<string>();
  for (const s of skills) {
    const where = `skill "${s.id}"`;
    if (!s.id || !SLUG_RE.test(s.id)) issues.push({ level: 'error', file: skillsFile, message: `${where}: id must be lowercase-kebab` });
    if (skillIds.has(s.id)) issues.push({ level: 'error', file: skillsFile, message: `${where}: duplicate id` });
    skillIds.add(s.id);
    if (!s.name) issues.push({ level: 'error', file: skillsFile, message: `${where}: name is required` });
    if (!groupIds.has(s.group)) issues.push({ level: 'error', file: skillsFile, message: `${where}: unknown group "${s.group}"` });
    if (!Number.isInteger(s.level) || s.level < 1 || s.level > 5)
      issues.push({ level: 'error', file: skillsFile, message: `${where}: level must be an integer 1–5` });
  }
  const checkSkills = (file: string, ids: string[]) => {
    for (const id of ids)
      if (!skillIds.has(id)) issues.push({ level: 'error', file, message: `unknown skill id "${id}" (define it in content/skills.json)` });
  };

  // ---- Know-how -----------------------------------------------------------
  const knowhow: KnowhowDoc[] = [];
  for (const file of mdFiles(files, 'content/knowhow')) {
    const raw = readMarkdown(files, file, issues);
    if (!raw) continue;
    const r = file;
    const c = new Checker(issues, r, raw.data);
    const folder = parentName(file);
    const slug = basename(file, '.md');
    if (!SLUG_RE.test(slug)) c.err(`file name "${slug}" must be lowercase-kebab`);
    const category = c.str('category');
    if (category && category !== folder) c.err(`category "${category}" must match folder "${folder}"`);
    const md = render(raw.body);
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
  for (const file of mdFiles(files, 'content/projects')) {
    const raw = readMarkdown(files, file, issues);
    if (!raw) continue;
    const r = file;
    const c = new Checker(issues, r, raw.data);
    const slug = basename(file, '.md');
    if (!SLUG_RE.test(slug)) c.err(`file name "${slug}" must be lowercase-kebab`);
    const md = render(raw.body);
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
  for (const file of mdFiles(files, 'content/blog')) {
    const raw = readMarkdown(files, file, issues);
    if (!raw) continue;
    const r = file;
    const c = new Checker(issues, r, raw.data);
    const base = basename(file, '.md');
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
    const md = render(raw.body);
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

  // ---- Profile --------------------------------------------------------------
  const profileFile = 'content/profile.json';
  const profile = readJson<Profile>(files, profileFile, issues, {
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
  for (const key of ['name', 'handle', 'role', 'tagline', 'description', 'email'] as const) {
    if (typeof profile[key] !== 'string' || !profile[key].trim())
      issues.push({ level: 'error', file: profileFile, message: `"${key}" is required` });
  }
  if (profile.photo) allLinks.push({ file: profileFile, href: profile.photo });
  if (!Array.isArray(profile.currentFocus)) issues.push({ level: 'error', file: profileFile, message: '"currentFocus" must be a list' });
  if (!Array.isArray(profile.socials)) issues.push({ level: 'error', file: profileFile, message: '"socials" must be a list' });
  for (const s of profile.socials ?? []) {
    if (!s.id || !s.label || !/^(https?:|mailto:)/.test(s.url ?? ''))
      issues.push({ level: 'error', file: profileFile, message: `social "${s.label || s.id}": id, label and an http(s)/mailto URL are required` });
  }

  // ---- Navigation -------------------------------------------------------------
  const navFile = 'content/navigation.json';
  const navigation = readJson<NavEntry[]>(files, navFile, issues, []);
  const knownNav = new Set(NAV_DEFAULTS.map((d) => d.id));
  if (!Array.isArray(navigation)) issues.push({ level: 'error', file: navFile, message: 'must be a list' });
  for (const n of Array.isArray(navigation) ? navigation : []) {
    if (!knownNav.has(n.id)) issues.push({ level: 'error', file: navFile, message: `unknown menu item "${n.id}" (known: ${[...knownNav].join(', ')})` });
    if (!n.label?.trim()) issues.push({ level: 'error', file: navFile, message: `menu item "${n.id}" needs a label` });
    if (typeof n.enabled !== 'boolean') issues.push({ level: 'error', file: navFile, message: `menu item "${n.id}": enabled must be true or false` });
  }

  // ---- Page texts -------------------------------------------------------------
  const pagesFile = 'content/pages.json';
  const pages = readJson<Record<string, PageText>>(files, pagesFile, issues, {});
  if (!pages || typeof pages !== 'object' || Array.isArray(pages)) issues.push({ level: 'error', file: pagesFile, message: 'must be an object { "<page>": { title, intro, … } }' });
  for (const [id, page] of Object.entries(pages ?? {})) {
    if (!page?.title?.trim()) issues.push({ level: 'error', file: pagesFile, message: `page "${id}" needs a title` });
    for (const m of page?.meta ?? []) if (!m.label?.trim()) issues.push({ level: 'error', file: pagesFile, message: `page "${id}": every meta line needs a label` });
  }

  // ---- JSON collections ---------------------------------------------------
  const hobbiesFile = 'content/hobbies.json';
  const hobbies = readJson<Hobby[]>(files, hobbiesFile, issues, []);
  for (const h of hobbies) {
    if (!h.id || !h.title || !h.text) issues.push({ level: 'error', file: hobbiesFile, message: `hobby "${h.id}": id, title and text are required` });
    if (h.image) allLinks.push({ file: hobbiesFile, href: h.image });
  }

  const cvFile = 'content/cv.json';
  const cv = readJson<Cv>(files, cvFile, issues, { personal: emptyPersonal(), summary: '', sections: [] });
  const cvErr = (message: string) => issues.push({ level: 'error', file: cvFile, message });
  if (!cv.personal || typeof cv.personal !== 'object') {
    cvErr('"personal" is required');
    cv.personal = emptyPersonal();
  }
  cv.personal = { ...emptyPersonal(), ...cv.personal };
  if (!Array.isArray(cv.sections)) {
    cvErr('"sections" must be a list');
    cv.sections = [];
  }
  const sectionIds = new Set<string>();
  for (const sec of cv.sections) {
    const where = `section "${sec.title || sec.id}"`;
    if (!sec.id || !SLUG_RE.test(sec.id)) cvErr(`${where}: id must be lowercase-kebab`);
    if (sectionIds.has(sec.id)) cvErr(`${where}: duplicate id`);
    sectionIds.add(sec.id);
    if (!sec.title?.trim()) cvErr(`${where}: title is required`);
    if (sec.type === 'timeline') {
      for (const e of sec.items ?? [])
        if (!e.title?.trim() || !e.org?.trim() || !CV_DATE_RE.test(e.start ?? '') || (e.end && !CV_DATE_RE.test(e.end)))
          cvErr(`${where} → "${e.title || '(untitled)'}": title, organisation and start (YYYY or YYYY-MM) are required; end must be YYYY or YYYY-MM`);
    } else if (sec.type === 'languages') {
      if (!Array.isArray(sec.motherTongues)) cvErr(`${where}: motherTongues must be a list`);
      for (const l of sec.items ?? []) {
        if (!l.name?.trim()) cvErr(`${where}: every language needs a name`);
        for (const k of ['listening', 'reading', 'spokenInteraction', 'spokenProduction', 'writing'] as const)
          if (!CEFR.includes(l[k])) cvErr(`${where} → ${l.name}: ${k} must be one of ${CEFR.join(', ')}`);
      }
    } else if (sec.type === 'list') {
      for (const it of sec.items ?? []) if (!it.name?.trim()) cvErr(`${where}: every entry needs a name`);
    } else if (sec.type !== 'text') {
      cvErr(`${where}: unknown type "${(sec as { type: string }).type}"`);
    }
  }
  if (cv.pdf) allLinks.push({ file: cvFile, href: cv.pdf });

  const certFile = 'content/certificates.json';
  const certificates = readJson<Certificate[]>(files, certFile, issues, []);
  for (const cert of certificates) {
    if (!cert.id || !cert.title || !cert.issuer)
      issues.push({ level: 'error', file: certFile, message: `certificate "${cert.id}": id, title and issuer are required` });
    if (!['planned', 'in progress', 'done'].includes(cert.status))
      issues.push({ level: 'error', file: certFile, message: `certificate "${cert.id}": invalid status "${cert.status}"` });
    checkSkills(certFile, cert.skills ?? []);
  }

  // ---- Translations (optional) ---------------------------------------------
  const translations = { de: {}, ja: {} } as Translations;
  for (const lang of TRANSLATION_LOCALES) {
    const file = `content/i18n/${lang}.json`;
    if (!(file in files)) continue;
    const dict = readJson<Record<string, unknown>>(files, file, issues, {});
    if (!dict || typeof dict !== 'object' || Array.isArray(dict)) {
      issues.push({ level: 'error', file, message: 'must be an object { "English text": "translation" }' });
      continue;
    }
    for (const [source, text] of Object.entries(dict)) {
      if (typeof text !== 'string') issues.push({ level: 'error', file, message: `translation of "${source.slice(0, 40)}" must be a string` });
      else if (text.trim()) translations[lang][source] = text;
    }
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
  ]);
  for (const { file, href } of allLinks) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
    if (valid.has(clean)) continue;
    if (publicFiles.has(clean)) continue;
    issues.push({ level: 'error', file, message: `broken internal link "${href}"` });
  }

  return {
    bundle: { profile, navigation: Array.isArray(navigation) ? navigation : [], pages: pages && typeof pages === 'object' ? pages : {}, skillGroups, skills, knowhow, projects, articles, hobbies, cv, certificates, translations },
    issues,
  };
}
