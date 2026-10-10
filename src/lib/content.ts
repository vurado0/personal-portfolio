import raw from 'virtual:content';
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

/** Content for rendering: the live, unpublished state in edit mode, otherwise the built content. */
export function useContent(): DerivedContent {
  const edit = useEdit();
  return derive(edit?.bundle ?? content);
}

/** Editable texts of a page, with a fallback so a missing entry never breaks the page. */
export function usePageText(id: string, fallback: PageText): PageText {
  const page = useContent().content.pages[id];
  return page ? { ...fallback, ...page } : fallback;
}

export const LEVEL_LABELS = ['', 'learning', 'learning', 'working', 'advanced', 'advanced'] as const;

export function levelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? 'working';
}

export function categoryLabel(category: string): string {
  const special: Record<string, string> = { macos: 'macOS', c: 'C', git: 'Git', ci: 'CI' };
  return special[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
