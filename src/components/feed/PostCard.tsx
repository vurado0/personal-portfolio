import { Link } from 'react-router';
import { cldUrl } from '../../lib/cloudinary';
import { ItemTools } from '../../lib/edit';
import type { Post, PostType } from '../../lib/feed';
import { formatDateTime, relativeTime } from '../../lib/format';
import { useLocale, useT, type MessageKey } from '../../i18n';
import { SkillChips, TagChip } from '../Chips';
import { ImageCarousel } from './ImageCarousel';
import { MusicCard } from './MusicCard';

export const typeLabel: Record<PostType, string> = {
  photo: 'Photo',
  text: 'Thought',
  achievement: 'Achievement',
  music: 'Music',
};

const typeKey: Record<PostType, MessageKey> = { photo: 'type.photo', text: 'type.text', achievement: 'type.achievement', music: 'type.music' };

/** Post type in the current language (`typeLabel` stays English for the owner's admin page). */
export function useTypeLabel(): (type: PostType) => string {
  const t = useT();
  return (type) => t(typeKey[type]);
}

/** Timeline (X-style) post: meta labels left, content right, thin rules between posts. */
export function PostCard({ post, detail = false }: { post: Post; detail?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const label = useTypeLabel();
  return (
    <article className="reveal group relative grid gap-x-8 gap-y-3 border-t border-ink/20 py-8 dark:border-cream/15 md:grid-cols-[9rem_1fr]">
      <ItemTools target={{ kind: 'post', id: post.id }} label={post.music?.title || post.text.slice(0, 40) || 'post'} />
      <dl className="meta-grid content-start md:grid-cols-[3.5rem_1fr]">
        <dt>{t('meta.type')}</dt>
        <dd className="text-fg">{label(post.type)}</dd>
        <dt>{t('meta.date')}</dt>
        <dd>
          <time dateTime={post.createdAt.toISOString()} title={formatDateTime(post.createdAt, locale)}>
            {relativeTime(post.createdAt, locale)}
          </time>
        </dd>
        {post.mood && post.type !== 'music' ? (
          <>
            <dt>{t('meta.mood')}</dt>
            <dd>{post.mood}</dd>
          </>
        ) : null}
        {!post.published ? (
          <>
            <dt>{t('meta.state')}</dt>
            <dd className="font-bold text-fg">{t('meta.draft')}</dd>
          </>
        ) : null}
      </dl>

      <div className="min-w-0 space-y-4">
        {post.type === 'achievement' ? (
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-accent text-2xl text-on-accent shadow-warm" aria-hidden="true">
              {post.badge || '★'}
            </span>
            <p className="blog-headline pt-1 text-3xl sm:text-4xl">{post.text}</p>
          </div>
        ) : post.type === 'music' && post.music ? null : (
          <p className={`whitespace-pre-line ${post.type === 'text' ? 'blog-headline text-3xl font-bold sm:text-[2.6rem]' : 'text-lg'}`}>{post.text}</p>
        )}

        {post.images.length > 0 ? <ImageCarousel images={post.images} /> : null}
        {post.type === 'music' && post.music ? <MusicCard music={post.music} comment={post.text} mood={post.mood} /> : null}

        {(post.tags.length > 0 || post.skills.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {post.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
            <SkillChips ids={post.skills} />
          </div>
        )}
        {!detail ? (
          <Link to={`/blog/p/${post.id}`} className="inline-block text-sm">
            {t('post.open')}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/** Photo grid (Instagram/VSCO-style) tile. */
export function PostTile({ post }: { post: Post }) {
  const t = useT();
  const label = useTypeLabel();
  const img = post.images[0] ?? (post.music?.coverUrl ? { url: post.music.coverUrl, alt: post.music.title } : null);
  return (
    <Link to={`/blog/p/${post.id}`} className="group relative block aspect-square overflow-hidden bg-latte/40 no-underline hover:no-underline" aria-label={`${label(post.type)}: ${post.text.slice(0, 80) || post.music?.title || t('post.fallbackTitle')}`}>
      {img ? (
        <img src={cldUrl(img.url, 480)} alt={img.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : post.type === 'music' && post.music ? (
        <div className="flex h-full flex-col justify-between bg-mocha p-3 text-cream">
          <span className="text-3xl" aria-hidden="true">
            ♪
          </span>
          <span>
            <span className="blog-headline line-clamp-2 block text-lg">{post.music.title || t('music.untitled')}</span>
            {post.music.artist ? <span className="block truncate text-xs text-latte">{post.music.artist}</span> : null}
          </span>
        </div>
      ) : (
        <div className="flex h-full items-end bg-foam p-3 dark:bg-dark-roast">
          <p className="blog-headline line-clamp-5 text-lg text-fg">
            {post.type === 'achievement' ? `${post.badge || '★'} ` : ''}
            {post.text}
          </p>
        </div>
      )}
      {post.images.length > 1 ? (
        <span className="absolute right-2 top-2 rounded-sm bg-espresso/70 px-1.5 text-xs text-cream">1/{post.images.length}</span>
      ) : null}
      {post.type === 'music' ? <span className="absolute right-2 top-2 rounded-sm bg-espresso/70 px-1.5 text-xs text-cream">♪</span> : null}
    </Link>
  );
}
