// GET /api/oembed?url=... — fetches title/artist/cover for a Spotify or SoundCloud link (admin only).
// Runs server-side so the admin page needs no CORS workaround and visitors never contact the providers.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, requireAdmin } from './_lib/auth.js';

const PROVIDERS: { re: RegExp; endpoint: (u: string) => string }[] = [
  {
    re: /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/[A-Za-z0-9]+/,
    endpoint: (u) => `https://open.spotify.com/oembed?url=${encodeURIComponent(u)}`,
  },
  {
    re: /^https:\/\/(?:on\.)?soundcloud\.com\/[^\s]+/,
    endpoint: (u) => `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(u)}`,
  },
];

type OEmbed = { title?: string; author_name?: string; thumbnail_url?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!(await requireAdmin(req, res))) return;
  const url = typeof req.query.url === 'string' ? req.query.url : '';
  const provider = PROVIDERS.find((p) => p.re.test(url));
  if (!provider) return res.status(400).json({ error: 'Only Spotify and SoundCloud links are supported' });

  try {
    const r = await fetch(provider.endpoint(url), { headers: { accept: 'application/json' } });
    if (!r.ok) return res.status(502).json({ error: `Provider answered HTTP ${r.status}` });
    const data = (await r.json()) as OEmbed;
    let title = data.title ?? '';
    let artist = data.author_name ?? '';
    // SoundCloud titles look like "Track by Artist".
    if (artist && title.endsWith(` by ${artist}`)) title = title.slice(0, -` by ${artist}`.length);
    if (!artist) {
      const m = / by (.+)$/.exec(title);
      if (m) {
        artist = m[1];
        title = title.slice(0, m.index);
      }
    }
    return res.status(200).json({ title, artist, thumbnailUrl: data.thumbnail_url ?? '' });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
