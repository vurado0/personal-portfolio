import { Link } from 'react-router';
import backgrounds from '../generated/backgrounds.json';
import { ArticleRow, KnowhowRow, ProjectCard } from '../components/Cards';
import { MusicCard } from '../components/feed/MusicCard';
import { PostTile } from '../components/feed/PostCard';
import { isEnabled } from '../config/site';
import { useContent } from '../lib/content';
import { AddButton, EditButton, useEdit } from '../lib/edit';
import { usePublishedPosts } from '../lib/feed';
import { Seo } from '../lib/head';
import { useT } from '../i18n';

function LatestFeed() {
  const state = usePublishedPosts(100);
  const editing = Boolean(useEdit());
  const t = useT();
  const posts = state.status === 'ready' ? state.data : [];
  if (!posts.length && !editing) return null;
  // The newest music post gets the "now playing" card; the grid shows the other posts (no duplicates).
  const music = posts.find((p) => p.type === 'music' && p.music);
  const tiles = posts.filter((p) => p !== music).slice(0, 6);
  const both = Boolean(music) && tiles.length > 0;
  return (
    <section className="container-page mt-20" aria-labelledby="feed-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="feed-title" className="section-title">
          {t('home.latestFeed')}
        </h2>
        <div className="flex items-center gap-3">
          <EditButton target={{ kind: 'post-new' }} label="new post" />
          <Link to="/blog" className="font-mono text-xs">
            {t('home.openFeed')}
          </Link>
        </div>
      </div>
      <div className={`mt-6 grid gap-6 ${both ? 'lg:grid-cols-[minmax(0,1fr)_26rem]' : ''}`}>
        {tiles.length > 0 && (
          <div className={`grid grid-cols-3 gap-1 self-start overflow-hidden rounded-lg ${both ? '' : 'sm:grid-cols-6'}`}>
            {tiles.map((p) => (
              <PostTile key={p.id} post={p} />
            ))}
          </div>
        )}
        {music?.music ? (
          <div className={`font-blog ${both ? '' : 'max-w-xl'}`}>
            <p className="section-title mb-3">{t('home.nowPlaying')}</p>
            <MusicCard music={music.music} comment={music.text} mood={music.mood} />
          </div>
        ) : null}
        {!posts.length ? <AddButton target={{ kind: 'post-new' }} label="Write your first post" /> : null}
      </div>
    </section>
  );
}

export default function Home() {
  const { content } = useContent();
  const site = content.profile;
  const t = useT();
  const featured = content.projects.filter((p) => p.featured).slice(0, 3);
  const espresso = backgrounds['espresso-shot'];
  return (
    <>
      <Seo path="/" image={site.photo || espresso.src} />
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-12">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-muted">
                <span className="text-accent">$</span> whoami
              </p>
              <EditButton target={{ kind: 'profile' }} label="edit profile" />
            </div>
            <h1 className="mt-4 font-mono text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {site.name}
              <span className="text-accent">.</span>
            </h1>
            <p className="mt-3 font-mono text-lg text-muted">{site.role}</p>
            <p className="mt-6 max-w-xl text-lg">{site.tagline}</p>

            <div className="mt-8 font-mono text-sm">
              <p className="section-title">{t('home.focus')}</p>
              <ul className="mt-3 space-y-1.5">
                {site.currentFocus.map((f) => (
                  <li key={f}>
                    <span className="text-accent">&gt;</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/projects" className="btn-primary">
                {t('home.viewProjects')}
              </Link>
              <Link to="/skills" className="btn-ghost">
                {t('home.skills')}
              </Link>
              {isEnabled('about') && (
                <Link to="/about" className="btn-ghost">
                  {t('home.cv')}
                </Link>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xs md:mx-0 md:ml-auto md:max-w-sm">
            <div className="absolute -inset-6 rounded-full bg-crema/10 blur-3xl" aria-hidden="true" />
            {site.photo ? (
              <img
                src={site.photo}
                width={886}
                height={886}
                alt={t('home.portraitAlt', { name: site.name })}
                fetchPriority="high"
                className="relative aspect-square w-full rounded-lg border border-line/60 bg-dark-roast object-cover shadow-warm"
              />
            ) : (
              <img
                src={espresso.src}
                width={espresso.width}
                height={espresso.height}
                alt=""
                fetchPriority="high"
                className="relative aspect-[4/5] w-full rounded-lg border border-line/60 object-cover shadow-warm"
                style={{ backgroundImage: `url(${espresso.placeholder})`, backgroundSize: 'cover' }}
              />
            )}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page mt-16" aria-labelledby="featured-title">
          <div className="flex items-baseline justify-between">
            <h2 id="featured-title" className="section-title">
              {t('home.featured')}
            </h2>
            <Link to="/projects" className="font-mono text-xs">
              {t('home.allProjects')}
            </Link>
          </div>
          <div className="stagger mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-20 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">{t('home.recentKnowhow')}</h2>
            <Link to="/knowhow" className="font-mono text-xs">
              {t('home.knowledgeBase')}
            </Link>
          </div>
          <div className="mt-2">
            {content.knowhow.slice(0, 4).map((d) => (
              <KnowhowRow key={d.url} doc={d} />
            ))}
          </div>
        </div>
        {content.articles.length > 0 && (
          <div data-side="personal" className="font-blog">
            <div className="flex items-baseline justify-between">
              <h2 className="section-title">{t('home.latestArticle')}</h2>
              <Link to="/blog/articles" className="font-mono text-xs">
                {t('home.allArticles')}
              </Link>
            </div>
            <div className="mt-2 [&_h3]:text-3xl sm:[&_h3]:text-4xl [&_article]:md:grid-cols-1">
              <ArticleRow article={content.articles[0]} />
            </div>
          </div>
        )}
      </section>

      <LatestFeed />
    </>
  );
}
