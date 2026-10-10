import { Link, useParams } from 'react-router';
import { KnowhowRow, ProjectCard } from '../components/Cards';
import { PostCard } from '../components/feed/PostCard';
import { useContent } from '../lib/content';
import { EditButton } from '../lib/edit';
import { usePublishedPosts } from '../lib/feed';
import { formatDate } from '../lib/format';
import { Seo } from '../lib/head';
import NotFound from './NotFound';
import { LevelBar } from './Skills';

export default function SkillDetail() {
  const { id = '' } = useParams();
  const { content, skillById, skillRefs } = useContent();
  const skill = skillById.get(id);
  const posts = usePublishedPosts(100);
  if (!skill) return <NotFound />;
  const refs = skillRefs.get(skill.id)!;
  const group = content.skillGroups.find((g) => g.id === skill.group);
  const linkedPosts = posts.status === 'ready' ? posts.data.filter((p) => p.skills.includes(skill.id)) : [];

  return (
    <>
      <Seo title={`${skill.name} — skill`} description={skill.context} path={`/skills/${skill.id}`} />
      <header className="container-page border-b border-line/60 pb-8 pt-12">
        <Link to="/skills" className="font-mono text-xs">
          ← all skills
        </Link>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="section-title">{group?.label ?? skill.group}</p>
          <EditButton target={{ kind: 'skill', id: skill.id }} />
        </div>
        <h1 className="mt-3 font-mono text-3xl font-bold sm:text-4xl">{skill.name}</h1>
        <div className="mt-4">
          <LevelBar level={skill.level} />
        </div>
        <p className="mt-4 max-w-2xl text-muted">{skill.context}</p>
      </header>

      <div className="container-page space-y-14 pt-10">
        <section aria-labelledby="sp">
          <h2 id="sp" className="section-title">
            projects ({refs.projects.length})
          </h2>
          {refs.projects.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {refs.projects.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No projects yet.</p>
          )}
        </section>

        <section aria-labelledby="sk">
          <h2 id="sk" className="section-title">
            know-how ({refs.knowhow.length})
          </h2>
          {refs.knowhow.length ? refs.knowhow.map((d) => <KnowhowRow key={d.url} doc={d} />) : <p className="mt-3 text-sm text-muted">No articles yet.</p>}
        </section>

        <section aria-labelledby="sa">
          <h2 id="sa" className="section-title">
            blog articles ({refs.articles.length})
          </h2>
          {refs.articles.length ? (
            <ul className="mt-3 space-y-2">
              {refs.articles.map((a) => (
                <li key={a.url} className="font-mono text-sm">
                  <span className="text-muted">{formatDate(a.date)}</span> <Link to={a.url}>{a.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No articles yet.</p>
          )}
        </section>

        <section aria-labelledby="sf" className="font-blog">
          <h2 id="sf" className="section-title">
            feed posts {posts.status === 'ready' ? `(${linkedPosts.length})` : ''}
          </h2>
          {posts.status === 'loading' && <p className="mt-3 text-sm text-muted">Loading…</p>}
          {posts.status === 'ready' && linkedPosts.length === 0 && <p className="mt-3 font-mono text-sm text-muted">No posts yet.</p>}
          {linkedPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      </div>
    </>
  );
}
