import raw from 'virtual:content';
import { contentDictionary, useLocale, type Locale } from '../i18n';
import { localizeBundle } from './content-core/localize';
import type { ArticleDoc, ContentBundle, KnowhowDoc, PageText, ProjectDoc, Skill } from '../types/content';
import { useEdit } from './edit';

/** Content as built into this deployment (prerendered). */
export const content = raw as ContentBundle;

export type SkillRefs = { projects: ProjectDoc[]; knowhow: KnowhowDoc[]; articles: ArticleDoc[] };

export type DerivedContent = {
  content: ContentBundle;
  skillById: Map<string, Skill>;
  /** Static (repo) references for each skill; feed posts are added at runtime from Firestore. */
  skillRefs: Map<string, SkillRefs>;
  knowhowCategories: string[];
};

const cache = new WeakMap<ContentBundle, DerivedContent>();

export function derive(bundle: ContentBundle): DerivedContent {
  const hit = cache.get(bundle);
  if (hit) return hit;
  const refs = new Map<string, SkillRefs>(bundle.skills.map((s) => [s.id, { projects: [], knowhow: [], articles: [] }]));
  for (const p of bundle.projects) p.skills.forEach((id) => refs.get(id)?.projects.push(p));
  for (const k of bundle.knowhow) k.skills.forEach((id) => refs.get(id)?.knowhow.push(k));
  for (const a of bundle.articles) a.skills.forEach((id) => refs.get(id)?.articles.push(a));
  const d: DerivedContent = {
    content: bundle,
    skillById: new Map(bundle.skills.map((s) => [s.id, s])),
    skillRefs: refs,
    knowhowCategories: [...new Set(bundle.knowhow.map((k) => k.category))].sort(),
  };
  cache.set(bundle, d);
  return d;
}

const localized = new WeakMap<ContentBundle, Map<Locale, ContentBundle>>();

/** Translations for a bundle: the live files in edit mode, otherwise the lazily loaded language pack. */
function dictionary(bundle: ContentBundle, locale: Exclude<Locale, 'en'>): Record<string, string> {
  const own = bundle.translations?.[locale];
  return own && Object.keys(own).length ? own : (contentDictionary(locale) ?? {});
}

/** The bundle in the visitor's language (short texts only; English stays the source). */
export function localize(bundle: ContentBundle, locale: Locale): ContentBundle {
  if (locale === 'en') return bundle;
  let byLocale = localized.get(bundle);
  if (!byLocale) localized.set(bundle, (byLocale = new Map()));
  let hit = byLocale.get(locale);
  if (!hit) byLocale.set(locale, (hit = localizeBundle(bundle, dictionary(bundle, locale))));
  return hit;
}

/** Content for rendering: the live, unpublished state in edit mode, otherwise the built content. */
export function useContent(): DerivedContent {
  const edit = useEdit();
  return derive(localize(edit?.bundle ?? content, useLocale()));
}

/** Translates one English content text (e.g. a code default) with the content dictionary. */
export function useContentText(): (s: string) => string {
  const locale = useLocale();
  const edit = useEdit();
  const dict = locale === 'en' ? null : dictionary(edit?.bundle ?? content, locale);
  return (s) => dict?.[s] ?? s;
}

/** Editable texts of a page, with a fallback so a missing entry never breaks the page. */
export function usePageText(id: string, fallback: PageText): PageText {
  const page = useContent().content.pages[id];
  const tr = useContentText();
  const base = { ...fallback, title: tr(fallback.title), label: fallback.label && tr(fallback.label), intro: fallback.intro && tr(fallback.intro) };
  return page ? { ...base, ...page } : base;
}

export const LEVEL_LABELS = ['', 'learning', 'learning', 'working', 'advanced', 'advanced'] as const;

export function levelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? 'working';
}

export const levelKey = (level: number) => `level.${levelLabel(level)}` as 'level.learning' | 'level.working' | 'level.advanced';

export function categoryLabel(category: string): string {
  const special: Record<string, string> = { macos: 'macOS', c: 'C', cpp: 'C++', git: 'Git', ci: 'CI', 'machine-learning': 'Machine learning' };
  return special[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
