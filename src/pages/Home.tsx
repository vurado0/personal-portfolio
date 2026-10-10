import { Link } from 'react-router';
import backgrounds from '../generated/backgrounds.json';
import { ArticleRow, KnowhowRow, ProjectCard } from '../components/Cards';
import { MusicCard } from '../components/feed/MusicCard';
import { PostTile } from '../components/feed/PostCard';
import { isEnabled, site } from '../config/site';
import { content } from '../lib/content';
import { usePublishedPosts } from '../lib/feed';
import { Seo } from '../lib/head';

function LatestFeed() {
  const state = usePublishedPosts(100);
  if (state.status !== 'ready' || state.data.length === 0) return null;
  const latest = state.data.slice(0, 6);
  const music = state.data.find((p) => p.type === 'music' && p.music);
  return (
    <section className="container-page mt-20" aria-labelledby="feed-title">
      <div className="flex items-baseline justify-between">
        <h2 id="feed-title" className="section-title">
          latest from the feed
        </h2>
        <Link to="/blog" className="font-mono text-xs">
          open feed →
        </Link>
      </div>
      <div className={`mt-6 grid gap-6 ${music ? 'lg:grid-cols-[1fr_24rem]' : ''}`}>
        <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg">
          {latest.map((p) => (
            <PostTile key={p.id} post={p} />
          ))}
        </div>
        {music?.music ? (
          <div data-side="personal" className="font-blog">
            <p className="section-title mb-3">now playing / current mood</p>
            <MusicCard music={music.music} comment={music.text} mood={music.mood} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function Home() {
  const featured = content.projects.filter((p) => p.featured).slice(0, 3);
  const espresso = backgrounds['espresso-shot'];
  return (
    <>
      <Seo path="/" image={espresso.src} />
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-mono text-sm text-muted">
              <span className="text-accent">$</span> whoami
            </p>
            <h1 className="mt-4 font-mono text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              {site.name}
              <span className="text-accent">.</span>
            </h1>
            <p className="mt-3 font-mono text-lg text-muted">{site.role}</p>
            <p className="mt-6 max-w-xl text-lg">{site.tagline}</p>

            <div className="mt-8 font-mono text-sm">
              <p className="section-title">current focus</p>
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
                View projects
              </Link>
              <Link to="/skills" className="btn-ghost">
                Skills
              </Link>
              {isEnabled('about') && (
                <Link to="/about" className="btn-ghost">
                  CV
                </Link>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="absolute -inset-6 rounded-full bg-crema/10 blur-3xl" aria-hidden="true" />
            <img
              src={espresso.src}
              width={espresso.width}
              height={espresso.height}
              alt="An espresso shot pouring from a portafilter"
              fetchPriority="high"
              className="relative aspect-[4/5] w-full rounded-lg border border-line/60 object-cover shadow-warm"
              style={{ backgroundImage: `url(${espresso.placeholder})`, backgroundSize: 'cover' }}
            />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page mt-16" aria-labelledby="featured-title">
          <div className="flex items-baseline justify-between">
            <h2 id="featured-title" className="section-title">
              featured projects
            </h2>
            <Link to="/projects" className="font-mono text-xs">
              all projects →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-20 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">recent know-how</h2>
            <Link to="/knowhow" className="font-mono text-xs">
              knowledge base →
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
              <h2 className="section-title">latest article</h2>
              <Link to="/blog/articles" className="font-mono text-xs">
                all articles →
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
