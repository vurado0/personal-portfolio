import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { TagChip } from '../components/Chips';
import { levelLabel, useContent } from '../lib/content';
import { AddButton, EditButton, ItemTools, useEdit } from '../lib/edit';
import { usePublishedPosts } from '../lib/feed';
import { Seo } from '../lib/head';
import type { Skill } from '../types/content';

export function LevelBar({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-2" title={`Level ${level} of 5`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-2 w-4 rounded-[1px] ${i <= level ? 'bg-accent' : 'bg-line/50'}`} />
        ))}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-label text-muted">
        {levelLabel(level)}
        <span className="sr-only"> (level {level} of 5)</span>
      </span>
    </span>
  );
}

function SkillCard({ skill, postCount }: { skill: Skill; postCount: number | null }) {
  const refs = useContent().skillRefs.get(skill.id) ?? { projects: [], knowhow: [], articles: [] };
  const counts = [
    ['projects', refs.projects.length],
    ['know-how', refs.knowhow.length],
    ['articles', refs.articles.length],
    ...(postCount !== null ? [['posts', postCount] as const] : []),
  ] as const;
  return (
    <article className="card group relative flex flex-col gap-3 hover:border-accent/70">
      <ItemTools target={{ kind: 'skill', id: skill.id }} label={skill.name} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono font-bold">
          <Link to={`/skills/${skill.id}`} className="text-fg after:absolute after:inset-0 hover:text-accent hover:no-underline">
            {skill.name}
          </Link>
        </h3>
        <LevelBar level={skill.level} />
      </div>
      <p className="text-sm text-muted">{skill.context}</p>
      <p className="mt-auto font-mono text-[11px] text-muted">
        {counts.map(([label, n], i) => (
          <span key={label}>
            {i > 0 ? ' · ' : ''}
            <span className={n > 0 ? 'text-fg' : ''}>{n}</span> {n === 1 ? label.replace(/s$/, '') : label}
          </span>
        ))}
      </p>
    </article>
  );
}

export default function Skills() {
  const { content } = useContent();
  const editing = Boolean(useEdit());
  const [params, setParams] = useSearchParams();
  const group = params.get('group');
  const posts = usePublishedPosts(100);
  const postCount = (id: string) => (posts.status === 'ready' ? posts.data.filter((p) => p.skills.includes(id)).length : null);
  const groups = content.skillGroups.filter((g) => !group || g.id === group);

  return (
    <>
      <Seo title="Skills" description="Skills grouped by area, each linked to the projects, know-how and posts where I used it." path="/skills" />
      <PageHeader label="skills" title="What I work with">
        Every skill links to the projects, know-how articles and posts where it shows up.
      </PageHeader>
      <div className="container-page">
        <div className="flex flex-wrap gap-1.5 py-6" role="group" aria-label="Filter by group">
          <TagChip tag="all" active={!group} onClick={() => setParams({}, { replace: true })} />
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
                  <SkillCard key={s.id} skill={s} postCount={postCount(s.id)} />
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
