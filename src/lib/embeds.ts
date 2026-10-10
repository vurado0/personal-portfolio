// Spotify / SoundCloud link detection and embed URLs.

export type MusicProvider = 'spotify' | 'soundcloud';
export type ParsedMusic = { provider: MusicProvider; url: string; embedUrl: string };

const SPOTIFY_RE = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/;
const SOUNDCLOUD_RE = /^https?:\/\/(?:www\.|m\.)?soundcloud\.com\/[^/\s]+\/[^\s?#]+/;
const SOUNDCLOUD_SHORT_RE = /^https?:\/\/on\.soundcloud\.com\/[A-Za-z0-9]+/;

export function parseMusicUrl(input: string): ParsedMusic | null {
  const url = input.trim();
  const sp = SPOTIFY_RE.exec(url);
  if (sp) {
    const [, kind, id] = sp;
    return {
      provider: 'spotify',
      url: `https://open.spotify.com/${kind}/${id}`,
      embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
    };
  }
  const sc = SOUNDCLOUD_RE.exec(url) ?? SOUNDCLOUD_SHORT_RE.exec(url);
  if (sc) {
    const clean = sc[0].replace('://m.', '://').replace('://www.', '://');
    return {
      provider: 'soundcloud',
      url: clean,
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%23d9822b&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&visual=false`,
    };
  }
  return null;
}

export const providerLabel: Record<MusicProvider, string> = { spotify: 'Spotify', soundcloud: 'SoundCloud' };
