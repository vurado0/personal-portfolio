import { Link, useParams } from 'react-router';
import backgrounds from '../generated/backgrounds.json';
import { ProjectCard, StatusBadge } from '../components/Cards';
import { SkillChips } from '../components/Chips';
import { Markdown } from '../components/Markdown';
import { useContent, usePageText } from '../lib/content';
import { AddButton, EditButton } from '../lib/edit';
import { Seo } from '../lib/head';
import NotFound from './NotFound';

export function Projects() {
  const { content } = useContent();
  const text = usePageText('projects', { label: 'projects', title: 'Things I built', intro: 'From idea to done: what each project solves, how, and what I learned.' });
  const bg = backgrounds['espresso-shot'];
  return (
    <>
      <Seo title="Projects" description="Projects with stack, role, status and lessons learned." path="/projects" />
      <header className="relative overflow-hidden border-b border-line/60">
        <div
          className="absolute inset-y-0 right-0 hidden w-1/2 opacity-60 sm:block"
          style={{ backgroundImage: `linear-gradient(90deg, rgb(var(--bg)) 0%, rgb(var(--bg) / 0.2) 60%), url(${bg.src}), url(${bg.placeholder})`, backgroundSize: 'cover', backgroundPosition: 'center 35%' }}
          aria-hidden="true"
        />
        <div className="container-page relative pb-10 pt-12 sm:pt-16">
          <div className="flex items-center justify-between gap-3">
            <p className="section-title">{text.label}</p>
            <EditButton target={{ kind: 'page', id: 'projects' }} label="page text" />
          </div>
          <h1 className="mt-3 font-mono text-3xl font-bold sm:text-4xl">{text.title}</h1>
          {text.intro ? <p className="mt-4 max-w-xl whitespace-pre-line text-muted">{text.intro}</p> : null}
        </div>
      </header>
      <div className="container-page mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {content.projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
        <AddButton target={{ kind: 'project' }} label="New project" className="min-h-60" />
      </div>
    </>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const { content } = useContent();
  const p = content.projects.find((x) => x.slug === slug);
  if (!p) return <NotFound />;
  const links = Object.entries(p.links).filter((e): e is [string, string] => Boolean(e[1]));
  return (
    <>
      <Seo title={p.title} description={p.summary} image={p.cover} type="article" path={p.url} />
      <article className="container-page max-w-4xl pt-10">
        <div className="flex items-center justify-between gap-3">
          <Link to="/projects" className="font-mono text-xs">
            ← all projects
          </Link>
          <EditButton target={{ kind: 'project', slug: p.slug }} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge status={p.status} />
          <span className="label">{p.period}</span>
        </div>
        <h1 className="mt-3 font-mono text-3xl font-bold leading-tight sm:text-5xl">{p.title}</h1>
        <p className="mt-4 text-lg text-muted">{p.summary}</p>

        <dl className="mt-8 grid gap-4 border-y border-line/60 py-6 font-mono text-sm sm:grid-cols-3">
          <div>
            <dt className="label">role</dt>
            <dd className="mt-1">{p.role}</dd>
          </div>
          <div>
            <dt className="label">stack</dt>
            <dd className="mt-1">{p.stack.join(' · ')}</dd>
          </div>
          <div>
            <dt className="label">links</dt>
            <dd className="mt-1 flex flex-wrap gap-3">
              {links.length
                ? links.map(([k, url]) => (
                    <a key={k} href={url} target="_blank" rel="noopener noreferrer">
                      {k} ↗
                    </a>
                  ))
                : '—'}
            </dd>
          </div>
        </dl>
        <SkillChips ids={p.skills} className="mt-6" />
        {p.cover ? <img src={p.cover} alt={`${p.title} cover`} className="mt-8 w-full rounded-lg border border-line/60" /> : null}
        <Markdown html={p.html} className="mt-10" />
      </article>
    </>
  );
}
