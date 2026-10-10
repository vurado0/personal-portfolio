import raw from 'virtual:content';
import type { ArticleDoc, ContentBundle, KnowhowDoc, ProjectDoc, Skill } from '../types/content';

export const content = raw as ContentBundle;

export const skillById = new Map(content.skills.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return skillById.get(id);
}

export const LEVEL_LABELS = ['', 'learning', 'learning', 'working', 'advanced', 'advanced'] as const;

export function levelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? 'working';
}

export type SkillRefs = { projects: ProjectDoc[]; knowhow: KnowhowDoc[]; articles: ArticleDoc[] };

/** Static (repo) references for each skill; feed posts are added at runtime from Firestore. */
export const skillRefs: Map<string, SkillRefs> = (() => {
  const refs = new Map<string, SkillRefs>(content.skills.map((s) => [s.id, { projects: [], knowhow: [], articles: [] }]));
  for (const p of content.projects) p.skills.forEach((id) => refs.get(id)?.projects.push(p));
  for (const k of content.knowhow) k.skills.forEach((id) => refs.get(id)?.knowhow.push(k));
  for (const a of content.articles) a.skills.forEach((id) => refs.get(id)?.articles.push(a));
  return refs;
})();

export const knowhowCategories = [...new Set(content.knowhow.map((k) => k.category))].sort();

export function categoryLabel(category: string): string {
  const special: Record<string, string> = { macos: 'macOS', c: 'C', git: 'Git', ci: 'CI' };
  return special[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
