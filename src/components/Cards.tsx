import { Link } from 'react-router';
import { categoryLabel } from '../lib/content';
import { ItemTools } from '../lib/edit';
import { formatDate } from '../lib/format';
import { useLocale, useT } from '../i18n';
import type { ArticleDoc, KnowhowDoc, ProjectDoc } from '../types/content';
import { SkillChips } from './Chips';

const statusStyle: Record<ProjectDoc['status'], string> = {
  idea: 'border-line text-muted',
  'in progress': 'border-accent text-accent',
  done: 'border-fg/60 text-fg',
};

export function StatusBadge({ status }: { status: ProjectDoc['status'] }) {
  const t = useT();
  return <span className={`chip ${statusStyle[status]}`}>{t(status === 'in progress' ? 'status.inProgress' : status === 'done' ? 'status.done' : 'status.idea')}</span>;
}

export function ProjectCard({ project }: { project: ProjectDoc }) {
  const t = useT();
  return (
    <article className="card group relative flex flex-col gap-3 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent/70">
      <ItemTools target={{ kind: 'project', slug: project.slug }} label={project.title} />
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
        <span className="text-accent">{t('card.stack')}</span> {project.stack.join(' · ')}
      </p>
      <div className="relative z-10">
        <SkillChips ids={project.skills.slice(0, 5)} />
      </div>
    </article>
  );
}

export function KnowhowRow({ doc }: { doc: KnowhowDoc }) {
  const t = useT();
  const locale = useLocale();
  return (
    <article className="reveal group relative grid gap-1 border-b border-line/50 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <ItemTools target={{ kind: 'knowhow', path: `content/knowhow/${doc.category}/${doc.slug}.md` }} label={doc.title} />
      <p className="label pt-1">{categoryLabel(doc.category)}</p>
      <div>
        <h3 className="font-mono font-bold">
          <Link to={doc.url} className="text-fg after:absolute after:inset-0 hover:text-accent hover:no-underline">
            {doc.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted">{doc.summary}</p>
        <p className="mt-2 font-mono text-[11px] text-muted">
          {t(`difficulty.${doc.difficulty}`)} · {t('card.minutes', { n: doc.readingMinutes })} · {t('card.updated')} {formatDate(doc.updated, locale)}
        </p>
      </div>
    </article>
  );
}

export function ArticleRow({ article }: { article: ArticleDoc }) {
  const t = useT();
  const locale = useLocale();
  return (
    <article className="reveal group relative grid gap-x-8 gap-y-2 border-t border-ink/20 py-8 dark:border-cream/15 md:grid-cols-[9rem_1fr]">
      <ItemTools target={{ kind: 'article', path: `content/blog/${article.date}-${article.slug}.md` }} label={article.title} />
      <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
        <dt>{t('meta.date')}</dt>
        <dd className="text-fg">
          <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
        </dd>
        <dt>{t('meta.read')}</dt>
        <dd>{t('card.minutes', { n: article.readingMinutes })}</dd>
        {article.draft ? (
          <>
            <dt>{t('meta.state')}</dt>
            <dd className="font-bold text-fg">{t('meta.draft')}</dd>
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
