import { useEffect, useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { POST_TYPES, usePublishedPosts, type PostType } from '../../lib/feed';
import { AddButton } from '../../lib/edit';
import { TagChip } from '../Chips';
import { Notice } from '../Notice';
import { PostCard, PostTile, useTypeLabel } from './PostCard';

type LayoutMode = 'timeline' | 'grid';

export function FeedView() {
  const state = usePublishedPosts(100);
  const t = useT();
  const typeLabel = useTypeLabel();
  const [layout, setLayout] = useState<LayoutMode>('timeline');
  const [type, setType] = useState<PostType | 'all'>('all');
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('feed-layout');
      if (saved === 'grid' || saved === 'timeline') setLayout(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const changeLayout = (l: LayoutMode) => {
    setLayout(l);
    try {
      localStorage.setItem('feed-layout', l);
    } catch {
      /* ignore */
    }
  };

  const posts = state.status === 'ready' ? state.data : [];
  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))].sort(), [posts]);
  const visible = posts.filter((p) => (type === 'all' || p.type === type) && (!tag || p.tags.includes(tag)));

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-ink/15 pb-5 dark:border-cream/15 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('filter.byType')}>
          <TagChip tag={t('filter.all')} active={type === 'all'} onClick={() => setType('all')} />
          {POST_TYPES.map((pt) => (
            <TagChip key={pt} tag={typeLabel(pt)} active={type === pt} onClick={() => setType(pt)} />
          ))}
        </div>
        <div className="flex gap-1.5" role="group" aria-label={t('feed.layout')}>
          <TagChip tag={t('feed.timeline')} active={layout === 'timeline'} onClick={() => changeLayout('timeline')} />
          <TagChip tag={t('feed.grid')} active={layout === 'grid'} onClick={() => changeLayout('grid')} />
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-4" role="group" aria-label={t('filter.byTag')}>
          {tags.map((tg) => (
            <TagChip key={tg} tag={`#${tg}`} active={tag === tg} onClick={() => setTag(tag === tg ? null : tg)} />
          ))}
        </div>
      )}

      <AddButton target={{ kind: 'post-new' }} label="New post — photo, thought, achievement or music" className="mt-6" />
      <div className="mt-6">
        {state.status === 'loading' && <p className="py-12 text-center text-muted">{t('common.loading')}</p>}
        {state.status === 'unconfigured' && <Notice title={t('feed.offline')}>{t('feed.notConfigured')}</Notice>}
        {state.status === 'error' && <Notice title={t('feed.spilled')}>{t('feed.error')}</Notice>}
        {state.status === 'ready' && visible.length === 0 && <Notice title={t('feed.nothing')}>{t('feed.empty')}</Notice>}
        {state.status === 'ready' && visible.length > 0 &&
          (layout === 'timeline' ? (
            <div>
              {visible.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
              {visible.map((p) => (
                <PostTile key={p.id} post={p} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
