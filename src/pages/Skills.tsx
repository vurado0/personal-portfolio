import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { TagChip } from '../components/Chips';
import { levelKey, useContent } from '../lib/content';
import { useT } from '../i18n';
import { AddButton, EditButton, ItemTools, useEdit } from '../lib/edit';
import { usePublishedPosts } from '../lib/feed';
import { Seo } from '../lib/head';
import type { Skill } from '../types/content';

export function LevelBar({ level }: { level: number }) {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-2" title={t('level.of', { n: level })}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-2 w-4 rounded-[1px] ${i <= level ? 'bg-accent' : 'bg-line/50'}`} />
        ))}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-label text-muted">
        {t(levelKey(level))}
        <span className="sr-only"> ({t('level.of', { n: level })})</span>
      </span>
    </span>
  );
}

function SkillCard({ skill, postCount, highlight }: { skill: Skill; postCount: number | null; highlight: boolean }) {
  const refs = useContent().skillRefs.get(skill.id) ?? { projects: [], knowhow: [], articles: [] };
  const t = useT();
  // Only show what is actually linked to this skill.
  const counts = (
    [
      ['project', refs.projects.length],
      ['knowhow', refs.knowhow.length],
      ['article', refs.articles.length],
      ['post', postCount ?? 0],
    ] as const
  ).filter(([, n]) => n > 0);
  return (
    <article id={`skill-${skill.id}`} className={`card group relative flex scroll-mt-24 flex-col gap-3 transition-shadow ${highlight ? 'border-accent ring-2 ring-accent/40' : ''}`}>
      <ItemTools target={{ kind: 'skill', id: skill.id }} label={skill.name} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono font-bold">{skill.name}</h3>
        <LevelBar level={skill.level} />
      </div>
      <p className="text-sm text-muted">{skill.context}</p>
      {counts.length > 0 ? (
        <p className="mt-auto font-mono text-[11px] text-muted">
          {counts.map(([label, n], i) => (
            <span key={label}>
              {i > 0 ? ' · ' : ''}
              <span className="text-fg">{n}</span> {t(label === 'knowhow' ? 'count.knowhow' : n === 1 ? `count.${label}` : `count.${label}s`)}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}

export default function Skills() {
  const { content } = useContent();
  const editing = Boolean(useEdit());
  const t = useT();
  const { hash } = useLocation();
  // Skill chips elsewhere link to /skills#skill-<id>: scroll to and highlight that card.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [hash]);
  const [params, setParams] = useSearchParams();
  const group = params.get('group');
  const posts = usePublishedPosts(100);
  const postCount = (id: string) => (posts.status === 'ready' ? posts.data.filter((p) => p.skills.includes(id)).length : null);
  const groups = content.skillGroups.filter((g) => !group || g.id === group);

  return (
    <>
      <Seo title="Skills" description="Skills grouped by area, each linked to the projects, know-how and posts where I used it." path="/skills" />
      <PageHeader pageId="skills" label="skills" title="What I work with">
        Every skill links to the projects, know-how articles and posts where it shows up.
      </PageHeader>
      <div className="container-page">
        <div className="flex flex-wrap gap-1.5 py-6" role="group" aria-label={t('filter.byGroup')}>
          <TagChip tag={t('filter.allLower')} active={!group} onClick={() => setParams({}, { replace: true })} />
          {content.skillGroups.map((g) => (
            <TagChip key={g.id} tag={g.label} active={group === g.id} onClick={() => setParams({ group: g.id }, { replace: true })} />
          ))}
          <EditButton target={{ kind: 'skill-groups' }} label="groups" />
        </div>
        {groups.map((g) => {
          const skills = content.skills.filter((s) => s.group === g.id).sort((a, b) => b.level - a.level);
          if (!skills.length && !editing) return null;
          return (
            <section key={g.id} className="mt-8" aria-labelledby={`g-${g.id}`}>
              <h2 id={`g-${g.id}`} className="section-title">
                {g.label}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((s) => (
                  <SkillCard key={s.id} skill={s} postCount={postCount(s.id)} highlight={hash === `#skill-${s.id}`} />
                ))}
                <AddButton target={{ kind: 'skill', group: g.id }} label={`Add ${g.label.toLowerCase()} skill`} className="min-h-40" />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
