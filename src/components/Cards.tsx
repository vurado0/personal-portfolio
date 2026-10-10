import { Link } from 'react-router';
import { categoryLabel } from '../lib/content';
import { formatDate } from '../lib/format';
import type { ArticleDoc, KnowhowDoc, ProjectDoc } from '../types/content';
import { SkillChips } from './Chips';

const statusStyle: Record<ProjectDoc['status'], string> = {
  idea: 'border-line text-muted',
  'in progress': 'border-accent text-accent',
  done: 'border-fg/60 text-fg',
};

export function StatusBadge({ status }: { status: ProjectDoc['status'] }) {
  return <span className={`chip ${statusStyle[status]}`}>{status === 'in progress' ? '● in progress' : status === 'done' ? '✓ done' : '○ idea'}</span>;
}

export function ProjectCard({ project }: { project: ProjectDoc }) {
  return (
    <article className="card group relative flex flex-col gap-3 transition-colors hover:border-accent/70">
      {project.cover ? (
        <img src={project.cover} alt="" loading="lazy" className="-mx-5 -mt-5 mb-1 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none rounded-t-lg object-cover" />
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="label">{project.period}</span>
        <StatusBadge status={project.status} />
      </div>
      <h3 className="font-mono text-lg font-bold leading-snug">
        <Link to={project.url} className="text-fg after:absolute after:inset-0 hover:text-accent hover:no-underline">
          {project.title}
        </Link>
      </h3>
      <p className="text-sm text-muted">{project.summary}</p>
      <p className="mt-auto font-mono text-xs text-muted">
        <span className="text-accent">stack:</span> {project.stack.join(' · ')}
      </p>
      <div className="relative z-10">
        <SkillChips ids={project.skills.slice(0, 5)} />
      </div>
    </article>
  );
}

export function KnowhowRow({ doc }: { doc: KnowhowDoc }) {
  return (
    <article className="relative grid gap-1 border-b border-line/50 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <p className="label pt-1">{categoryLabel(doc.category)}</p>
      <div>
        <h3 className="font-mono font-bold">
          <Link to={doc.url} className="text-fg after:absolute after:inset-0 hover:text-accent hover:no-underline">
            {doc.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted">{doc.summary}</p>
        <p className="mt-2 font-mono text-[11px] text-muted">
          {doc.difficulty} · {doc.readingMinutes} min · updated {formatDate(doc.updated)}
        </p>
      </div>
    </article>
  );
}

export function ArticleRow({ article }: { article: ArticleDoc }) {
  return (
    <article className="relative grid gap-x-8 gap-y-2 border-t border-ink/20 py-8 dark:border-cream/15 md:grid-cols-[9rem_1fr]">
      <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
        <dt>Date:</dt>
        <dd className="text-fg">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </dd>
        <dt>Read:</dt>
        <dd>{article.readingMinutes} min</dd>
        {article.draft ? (
          <>
            <dt>State:</dt>
            <dd className="font-bold text-fg">Draft</dd>
          </>
        ) : null}
      </dl>
      <div>
        <h3 className="blog-headline text-3xl sm:text-5xl">
          <Link to={article.url} className="text-fg after:absolute after:inset-0 hover:text-mocha hover:no-underline dark:hover:text-crema">
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 max-w-2xl text-muted">{article.summary}</p>
        <p className="mt-3 text-sm text-muted">{article.tags.map((t) => `#${t}`).join('  ')}</p>
      </div>
    </article>
  );
}
