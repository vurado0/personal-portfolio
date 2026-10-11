import { useState } from 'react';
import { useT } from '../../i18n';
import { cldUrl } from '../../lib/cloudinary';
import { providerLabel } from '../../lib/embeds';
import type { MusicInfo } from '../../lib/feed';
import { Background } from '../Background';

/**
 * Click-to-load music card (GDPR): nothing is requested from Spotify/SoundCloud until the
 * visitor presses "Play preview". The cover is served from Cloudinary, not the provider.
 */
export function MusicCard({ music, comment, mood }: { music: MusicInfo; comment?: string; mood?: string }) {
  const [loaded, setLoaded] = useState(false);
  const t = useT();
  const provider = providerLabel[music.provider];
  const height = music.provider === 'spotify' ? 152 : 166;

  return (
    <Background name="latte-swirl" className="rounded-lg border border-line/60" position="center 30%">
      <div className="p-4 sm:p-5">
        {loaded ? (
          // The provider's player already shows cover, title and artist.
          <p className="label">{mood ? t('music.mood', { mood }) : t('music.nowPlaying', { provider })}</p>
        ) : (
          <div className="flex gap-4">
            {music.coverUrl ? (
              <img src={cldUrl(music.coverUrl, 240)} alt="" width={96} height={96} loading="lazy" className="h-24 w-24 flex-none rounded-md object-cover shadow-warm" />
            ) : (
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-md bg-mocha text-3xl text-cream" aria-hidden="true">
                ♪
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="label">{mood ? t('music.mood', { mood }) : t('music.nowPlaying', { provider })}</p>
              <p className="blog-headline mt-1 truncate text-2xl">{music.title || t('music.untitled')}</p>
              {music.artist ? <p className="truncate text-muted">{music.artist}</p> : null}
              {comment ? <p className="mt-2 line-clamp-3 text-sm">{comment}</p> : null}
            </div>
          </div>
        )}
        {loaded && comment ? <p className="mt-2 line-clamp-3 text-sm">{comment}</p> : null}
        <div className={loaded ? 'mt-3' : 'mt-4'}>
          {loaded ? (
            <iframe
              title={`${provider} player: ${music.title}`}
              src={music.embedUrl}
              width="100%"
              height={height}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="rounded-md border-0"
            />
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button type="button" className="btn-primary flex-none whitespace-nowrap" onClick={() => setLoaded(true)}>
                ▶ {t('music.play')}
              </button>
              <p className="text-xs text-muted">{t('music.consent', { provider })}</p>
            </div>
          )}
          <p className="mt-2 text-xs">
            <a href={music.url} target="_blank" rel="noopener noreferrer">
              {t('music.open', { provider })}
            </a>
          </p>
        </div>
      </div>
    </Background>
  );
}
