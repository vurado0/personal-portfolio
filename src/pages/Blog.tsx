import { useEffect, useState } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router';
import { ArticleRow } from '../components/Cards';
import { SkillChips, TagChip } from '../components/Chips';
import { Background } from '../components/Background';
import { FeedView } from '../components/feed/FeedView';
import { PostCard, typeLabel } from '../components/feed/PostCard';
import { Markdown } from '../components/Markdown';
import { Notice } from '../components/Notice';
import { content } from '../lib/content';
import { cldUrl } from '../lib/cloudinary';
import { getPost, type Post } from '../lib/feed';
import { NotConfiguredError } from '../lib/firebase';
import { formatDate } from '../lib/format';
import { Seo } from '../lib/head';
import NotFound from './NotFound';

function BlogHeader() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `-mb-px border-b-2 px-1 pb-3 text-lg font-bold no-underline hover:no-underline ${isActive ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`;
  return (
    <Background name="coffee-waves" position="center 40%">
      <div className="container-page pt-14 sm:pt-20">
        <div className="grid gap-6 md:grid-cols-[9rem_1fr]">
          <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
            <dt>Blog:</dt>
            <dd className="text-fg">Personal</dd>
            <dt>Style:</dt>
            <dd>Feed & Articles</dd>
          </dl>
          <div>
            <h1 className="blog-headline text-6xl sm:text-8xl">Daily grind.</h1>
            <p className="mt-4 max-w-xl text-lg">Photos, small wins, thoughts and the songs on repeat — plus longer articles.</p>
          </div>
        </div>
        <nav aria-label="Blog sections" className="mt-10 flex gap-6 border-b border-ink/20 dark:border-cream/20">
          <NavLink to="/blog" end className={tab}>
            Feed
          </NavLink>
          <NavLink to="/blog/articles" className={tab}>
            Articles
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
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag');
  const tags = [...new Set(content.articles.flatMap((a) => a.tags))].sort();
  const list = content.articles.filter((a) => !tag || a.tags.includes(tag));
  return (
    <>
      <Seo title="Blog — Articles" description="Longer articles and write-ups." path="/blog/articles" />
      <BlogHeader />
      <div className="container-page max-w-5xl pt-8">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-6" role="group" aria-label="Filter by tag">
            <TagChip tag="All" active={!tag} onClick={() => setParams({}, { replace: true })} />
            {tags.map((t) => (
              <TagChip key={t} tag={`#${t}`} active={tag === t} onClick={() => setParams({ tag: t }, { replace: true })} />
            ))}
          </div>
        )}
        {list.length ? list.map((a) => <ArticleRow key={a.slug} article={a} />) : <Notice title="No articles yet" />}
      </div>
    </>
  );
}

export function BlogArticle() {
  const { slug } = useParams();
  const a = content.articles.find((x) => x.slug === slug);
  if (!a) return <NotFound />;
  return (
    <>
      <Seo title={a.title} description={a.summary} image={a.cover} type="article" path={a.url} />
      <article className="container-page max-w-5xl pt-10">
        <Link to="/blog/articles" className="text-sm">
          ← Articles
        </Link>
        <div className="mt-8 grid gap-6 border-t border-ink/25 pt-6 dark:border-cream/20 md:grid-cols-[9rem_1fr]">
          <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
            <dt>Date:</dt>
            <dd className="text-fg">
              <time dateTime={a.date}>{formatDate(a.date)}</time>
            </dd>
            <dt>Read:</dt>
            <dd>{a.readingMinutes} min</dd>
            <dt>Tags:</dt>
            <dd>{a.tags.join(', ')}</dd>
          </dl>
          <div className="min-w-0">
            {a.draft ? <p className="label mb-3 text-fg">Draft — not visible on the live site</p> : null}
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
  const title = post ? post.music?.title || post.text.slice(0, 60) || typeLabel[post.type] : 'Post';
  const image = post?.images[0]?.url ?? post?.music?.coverUrl;
  return (
    <>
      <Seo title={title} description={post?.text.slice(0, 160)} image={image ? cldUrl(image, 1200) : undefined} type="article" />
      <div className="container-page max-w-4xl pt-10">
        <Link to="/blog" className="text-sm">
          ← Feed
        </Link>
        <div className="mt-6">
          {state.status === 'loading' && <p className="py-12 text-center text-muted">Loading…</p>}
          {state.status === 'unconfigured' && <Notice title="Feed offline">Firebase is not configured.</Notice>}
          {state.status === 'error' && <Notice title="Spilled the coffee">This post could not be loaded.</Notice>}
          {post && <PostCard post={post} detail />}
        </div>
        {post && (
          <p className="mt-4 border-t border-ink/20 pt-4 text-sm text-muted dark:border-cream/15">
            Share:{' '}
            <button
              type="button"
              className="underline"
              onClick={() => (navigator.share ? navigator.share({ url: location.href, title }) : navigator.clipboard.writeText(location.href))}
            >
              copy link
            </button>
          </p>
        )}
      </div>
    </>
  );
}
