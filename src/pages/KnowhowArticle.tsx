import { Link, useParams } from 'react-router';
import { SkillChips, TagChip } from '../components/Chips';
import { Markdown } from '../components/Markdown';
import { Toc } from '../components/Toc';
import { categoryLabel, useContent } from '../lib/content';
import { EditButton } from '../lib/edit';
import { formatDate } from '../lib/format';
import { Seo } from '../lib/head';
import { useLocale, useT } from '../i18n';
import NotFound from './NotFound';

export default function KnowhowArticle() {
  const { category, slug } = useParams();
  const { content } = useContent();
  const t = useT();
  const locale = useLocale();
  const doc = content.knowhow.find((d) => d.category === category && d.slug === slug);
  if (!doc) return <NotFound />;
  return (
    <>
      <Seo title={doc.title} description={doc.summary} type="article" path={doc.url} />
      <article className="container-page grid gap-10 pt-10 lg:grid-cols-[1fr_14rem]">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
              <Link to="/knowhow">{t('knowhow.crumb')}</Link> / <Link to={`/knowhow/${doc.category}`}>{categoryLabel(doc.category)}</Link>
            </nav>
            <EditButton target={{ kind: 'knowhow', path: `content/knowhow/${doc.category}/${doc.slug}.md` }} />
          </div>
          <h1 className="mt-4 font-mono text-3xl font-bold leading-tight sm:text-4xl">{doc.title}</h1>
          <p className="mt-3 max-w-2xl text-muted">{doc.summary}</p>
          <p className="mt-4 font-mono text-xs text-muted">
            <span className="text-accent">{t('knowhow.updated')}</span> {formatDate(doc.updated, locale)} · <span className="text-accent">{t('knowhow.level')}</span>{' '}
            {t(`difficulty.${doc.difficulty}`)} · {t('knowhow.minRead', { n: doc.readingMinutes })}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <SkillChips ids={doc.skills} />
            {doc.tags.map((tg) => (
              <TagChip key={tg} tag={`#${tg}`} />
            ))}
          </div>
          <div className="mt-6 lg:hidden">
            <Toc headings={doc.headings} />
          </div>
          <hr className="my-8 border-line/60" />
          <Markdown html={doc.html} className="prose-sm sm:prose-base" />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Toc headings={doc.headings} />
          </div>
        </aside>
      </article>
    </>
  );
}
