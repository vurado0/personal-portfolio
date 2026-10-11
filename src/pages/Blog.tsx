import { Fragment, useEffect, useState } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router';
import { ArticleRow } from '../components/Cards';
import { SkillChips, TagChip } from '../components/Chips';
import { Background } from '../components/Background';
import { FeedView } from '../components/feed/FeedView';
import { PostCard, useTypeLabel } from '../components/feed/PostCard';
import { Markdown } from '../components/Markdown';
import { Notice } from '../components/Notice';
import { useContent, usePageText } from '../lib/content';
import { AddButton, EditButton } from '../lib/edit';
import { cldUrl } from '../lib/cloudinary';
import { getPost, type Post } from '../lib/feed';
import { NotConfiguredError } from '../lib/firebase';
import { formatDate } from '../lib/format';
import { Seo } from '../lib/head';
import { useLocale, useT } from '../i18n';
import NotFound from './NotFound';

function BlogHeader() {
  const t = useT();
  const text = usePageText('blog', {
    title: 'Daily grind.',
    intro: 'Photos, small wins, thoughts and the songs on repeat — plus longer articles.',
    meta: [
      { label: 'Blog', value: 'Personal' },
      { label: 'Style', value: 'Feed & Articles' },
    ],
  });
  const tab = ({ isActive }: { isActive: boolean }) =>
    `-mb-px border-b-2 px-1 pb-3 text-lg font-bold no-underline hover:no-underline ${isActive ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`;
  return (
    <Background name="coffee-waves" position="center 40%">
      <div className="container-page pt-14 sm:pt-20">
        <div className="grid gap-6 md:grid-cols-[9rem_1fr]">
          <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
            {(text.meta ?? []).map((m, i) => (
              <Fragment key={m.label}>
                <dt>{m.label}:</dt>
                <dd className={i === 0 ? 'text-fg' : ''}>{m.value}</dd>
              </Fragment>
            ))}
          </dl>
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="blog-headline text-6xl sm:text-8xl">{text.title}</h1>
              <EditButton target={{ kind: 'page', id: 'blog' }} label="page text" />
            </div>
            {text.intro ? <p className="mt-4 max-w-xl whitespace-pre-line text-lg">{text.intro}</p> : null}
          </div>
        </div>
        <nav aria-label={t('blog.sections')} className="mt-10 flex gap-6 border-b border-ink/20 dark:border-cream/20">
          <NavLink to="/blog" end className={tab}>
            {t('blog.feed')}
          </NavLink>
          <NavLink to="/blog/articles" className={tab}>
            {t('blog.articles')}
          </NavLink>
        </nav>
      </div>
    </Background>
  );
}

export function BlogFeed() {
  return (
    <>
      <Seo title="Blog — Feed" description="Short posts: photos, daily achievements, thoughts and music." path="/blog" />
      <BlogHeader />
      <div className="container-page max-w-4xl pt-8">
        <FeedView />
      </div>
    </>
  );
}

export function BlogArticles() {
  const { content } = useContent();
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag');
  const t = useT();
  const tags = [...new Set(content.articles.flatMap((a) => a.tags))].sort();
  const list = content.articles.filter((a) => !tag || a.tags.includes(tag));
  return (
    <>
      <Seo title="Blog — Articles" description="Longer articles and write-ups." path="/blog/articles" />
      <BlogHeader />
      <div className="container-page max-w-5xl pt-8">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-6" role="group" aria-label={t('filter.byTag')}>
            <TagChip tag={t('filter.all')} active={!tag} onClick={() => setParams({}, { replace: true })} />
            {tags.map((tg) => (
              <TagChip key={tg} tag={`#${tg}`} active={tag === tg} onClick={() => setParams({ tag: tg }, { replace: true })} />
            ))}
          </div>
        )}
        {list.length ? list.map((a) => <ArticleRow key={a.slug} article={a} />) : <Notice title={t('blog.noArticles')} />}
        <AddButton target={{ kind: 'article' }} label="New article" className="mt-6" />
      </div>
    </>
  );
}

export function BlogArticle() {
  const { slug } = useParams();
  const { content } = useContent();
  const t = useT();
  const locale = useLocale();
  const a = content.articles.find((x) => x.slug === slug);
  if (!a) return <NotFound />;
  return (
    <>
      <Seo title={a.title} description={a.summary} image={a.cover} type="article" path={a.url} />
      <article className="container-page max-w-5xl pt-10">
        <div className="flex items-center justify-between gap-3">
          <Link to="/blog/articles" className="text-sm">
            {t('blog.backArticles')}
          </Link>
          <EditButton target={{ kind: 'article', path: `content/blog/${a.date}-${a.slug}.md` }} />
        </div>
        <div className="mt-8 grid gap-6 border-t border-ink/25 pt-6 dark:border-cream/20 md:grid-cols-[9rem_1fr]">
          <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
            <dt>{t('meta.date')}</dt>
            <dd className="text-fg">
              <time dateTime={a.date}>{formatDate(a.date, locale)}</time>
            </dd>
            <dt>{t('meta.read')}</dt>
            <dd>{t('card.minutes', { n: a.readingMinutes })}</dd>
            <dt>{t('meta.tags')}</dt>
            <dd>{a.tags.join(', ')}</dd>
          </dl>
          <div className="min-w-0">
            {a.draft ? <p className="label mb-3 text-fg">{t('blog.draftNote')}</p> : null}
            <h1 className="blog-headline text-5xl sm:text-7xl">{a.title}</h1>
            <p className="mt-5 max-w-2xl text-xl text-muted">{a.summary}</p>
            <SkillChips ids={a.skills} className="mt-5" />
          </div>
        </div>
        {a.cover ? <img src={a.cover} alt="" className="mt-10 w-full rounded-lg" /> : null}
        <div className="mt-10 md:ml-[11rem]">
          <Markdown html={a.html} className="prose-lg max-w-2xl" />
        </div>
      </article>
    </>
  );
}

export function PostDetail() {
  const { id = '' } = useParams();
  const t = useT();
  const typeLabel = useTypeLabel();
  const [state, setState] = useState<{ status: 'loading' | 'missing' | 'unconfigured' | 'error' } | { status: 'ready'; post: Post }>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    getPost(id).then(
      (post) => alive && setState(post ? { status: 'ready', post } : { status: 'missing' }),
      (e) => alive && setState({ status: e instanceof NotConfiguredError ? 'unconfigured' : 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === 'missing') return <NotFound />;
  const post = state.status === 'ready' ? state.post : null;
  const title = post ? post.music?.title || post.text.slice(0, 60) || typeLabel(post.type) : t('post.fallbackTitle');
  const image = post?.images[0]?.url ?? post?.music?.coverUrl;
  return (
    <>
      <Seo title={title} description={post?.text.slice(0, 160)} image={image ? cldUrl(image, 1200) : undefined} type="article" />
      <div className="container-page max-w-4xl pt-10">
        <Link to="/blog" className="text-sm">
          {t('blog.backFeed')}
        </Link>
        <div className="mt-6">
          {state.status === 'loading' && <p className="py-12 text-center text-muted">{t('common.loading')}</p>}
          {state.status === 'unconfigured' && <Notice title={t('feed.offline')}>{t('post.notConfigured')}</Notice>}
          {state.status === 'error' && <Notice title={t('feed.spilled')}>{t('post.loadError')}</Notice>}
          {post && <PostCard post={post} detail />}
        </div>
        {post && (
          <p className="mt-4 border-t border-ink/20 pt-4 text-sm text-muted dark:border-cream/15">
            {t('post.share')}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => (navigator.share ? navigator.share({ url: location.href, title }) : navigator.clipboard.writeText(location.href))}
            >
              {t('post.copyLink')}
            </button>
          </p>
        )}
      </div>
    </>
  );
}
