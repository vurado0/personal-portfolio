// Runs after `vite build` (client) and `vite build --ssr` (server bundle):
// prerenders portfolio pages + articles to static HTML and writes spa.html, sitemap.xml, robots.txt and rss.xml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';
import { enabledNav, isEnabled, sideForPath, site } from '../src/config/site.ts';
import type { HeadData, HeadLanguages } from '../src/types/head.ts';
import { loadContent } from './lib/content.ts';
import { japaneseFontFiles, writeJapaneseFont } from './lib/japanese-font.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const env = { ...loadEnv('production', root, ''), ...process.env };

const siteUrl = (
  env.SITE_URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  site.url
).replace(/\/$/, '');

type ServerEntry = {
  render: (url: string) => Promise<{ html: string; head: HeadData }>;
  headToHtml: (data: HeadData, baseUrl: string, languages?: HeadLanguages) => string;
};
const entryFile = ['entry-server.js', 'entry-server.mjs'].map((f) => path.join(root, 'dist-ssr', f)).find((f) => fs.existsSync(f));
if (!entryFile) throw new Error('dist-ssr/entry-server.js not found — run `vite build --ssr src/entry-server.tsx --outDir dist-ssr` first');
const { render, headToHtml } = (await import(pathToFileURL(entryFile).href)) as ServerEntry;

const { bundle } = loadContent({ root, includeDrafts: false });
// Preload the body font (JetBrains Mono, latin 400/700) so text renders in its final font without a swap.
const fontPreloads = fs
  .readdirSync(path.join(dist, 'assets'))
  .filter((f) => /^jetbrains-mono-latin-(400|700)-normal-[\w-]+\.woff2$/.test(f))
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`)
  .join('\n    ');
const template = fs
  .readFileSync(path.join(dist, 'index.html'), 'utf8')
  .replace('<!--app-head-->', `${fontPreloads}\n    <!--app-head-->`);
// German / Japanese pages hydrate only after their language chunks loaded: fetch them right away.
// Japanese pages also preload their font (written by writeJapaneseFont below).
const packPreloads = (locale: string) =>
  [
    ...fs
      .readdirSync(path.join(dist, 'assets'))
      .filter((f) => new RegExp(`^${locale}-[\\w-]+\\.js$`).test(f))
      .map((f) => `<link rel="modulepreload" href="/assets/${f}">`),
    ...(locale === 'ja' ? japaneseFontFiles.map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`) : []),
  ].join('\n    ');

// ---- Routes ---------------------------------------------------------------
const routes = new Set<string>(['/', '/impressum', '/datenschutz']);
for (const item of enabledNav) routes.add(item.path);
if (isEnabled('knowhow')) {
  bundle.knowhow.forEach((d) => {
    routes.add(`/knowhow/${d.category}`);
    routes.add(d.url);
  });
}
if (isEnabled('projects')) bundle.projects.forEach((p) => routes.add(p.url));
if (isEnabled('blog')) {
  routes.add('/blog/articles');
  bundle.articles.forEach((a) => routes.add(a.url));
}

// Every page also exists in German and Japanese (/de/…, /ja/…). Only pages whose texts are translated
// are offered to search engines in those languages; know-how, project and article pages (English
// text) and the legal pages point to their English URL as the canonical one.
const LOCALES = ['en', 'de', 'ja'] as const;
type Locale = (typeof LOCALES)[number];
const OG_LOCALE: Record<Locale, string> = { en: 'en_GB', de: 'de_AT', ja: 'ja_JP' };
const translatedRoutes = new Set(['/', '/blog/articles', ...enabledNav.map((i) => i.path)]);
const prefixed = (url: string, locale: Locale) => (locale === 'en' ? url : url === '/' ? `/${locale}` : `/${locale}${url}`);
const alternates = (url: string) => [
  ...LOCALES.map((l) => ({ hreflang: l, path: prefixed(url, l) })),
  { hreflang: 'x-default', path: url },
];

function page(html: string, head: string, pathname: string, locale: Locale = 'en'): string {
  const out = template
    .replace('<!--app-head-->', locale === 'en' ? head : `${packPreloads(locale)}\n    ${head}`)
    .replace('<!--app-html-->', html)
    .replace('data-side="portfolio"', `data-side="${sideForPath(pathname)}"`);
  return locale === 'en' ? out : out.replace('<html lang="en"', `<html lang="${locale}"`);
}

// SPA fallback for runtime-only routes (/blog/p/:id, /admin, unknown URLs): empty root, generic head.
fs.writeFileSync(path.join(dist, 'spa.html'), page('', headToHtml({ path: '/' }, siteUrl), '/'));

let count = 0;
for (const url of routes) {
  const translated = translatedRoutes.has(url);
  for (const locale of LOCALES) {
    const target = prefixed(url, locale);
    const { html, head } = await render(target);
    const dict = bundle.translations[locale as 'de' | 'ja'] ?? {};
    const data: HeadData = { ...head, description: head.description ?? dict[site.description] ?? site.description };
    const canonical = translated ? target : url;
    const file = target === '/' ? path.join(dist, 'index.html') : path.join(dist, `${target.slice(1)}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const languages: HeadLanguages = { locale, ogLocale: OG_LOCALE[locale], alternates: translated ? alternates(url) : undefined };
    fs.writeFileSync(file, page(html, headToHtml({ ...data, path: canonical }, siteUrl, languages), url, locale));
    count++;
  }
}
const notFound = await render('/__not-found__');
fs.writeFileSync(path.join(dist, '404.html'), page(notFound.html, headToHtml({ ...notFound.head, path: '/404' }, siteUrl), '/404'));

const jaFont = await writeJapaneseFont(root, dist);

// ---- sitemap.xml / robots.txt --------------------------------------------
const lastmod: Record<string, string> = {};
bundle.knowhow.forEach((d) => (lastmod[d.url] = d.updated));
bundle.articles.forEach((a) => (lastmod[a.url] = a.date));
const loc = (u: string) => `${siteUrl}${u === '/' ? '' : u}`;
const sitemapEntries = [...routes].flatMap((u) => {
  const date = lastmod[u] ? `<lastmod>${lastmod[u]}</lastmod>` : '';
  if (!translatedRoutes.has(u)) return [`  <url><loc>${loc(u)}</loc>${date}</url>`];
  const links = alternates(u)
    .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${loc(a.path)}"/>`)
    .join('');
  return LOCALES.map((l) => `  <url><loc>${loc(prefixed(u, l))}</loc>${date}${links}</url>`);
});
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries.join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
const disallow = LOCALES.flatMap((l) => [`Disallow: ${prefixed('/admin', l)}`, `Disallow: ${prefixed('/login', l)}`]).join('\n');
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${disallow}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

// ---- rss.xml: articles + published feed posts (best effort via Firestore REST) ----
type RssItem = { title: string; link: string; date: Date; description: string };
const items: RssItem[] = bundle.articles.map((a) => ({
  title: a.title,
  link: `${siteUrl}${a.url}`,
  date: new Date(a.date + 'T08:00:00Z'),
  description: a.summary,
}));

async function feedPosts(): Promise<RssItem[]> {
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey || env.VITE_USE_EMULATORS === 'true') return [];
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'posts' }],
        where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: 20,
      },
    }),
  });
  if (!res.ok) throw new Error(`Firestore REST ${res.status}`);
  type F = { stringValue?: string; timestampValue?: string; mapValue?: { fields?: Record<string, F> } };
  const rows = (await res.json()) as { document?: { name: string; fields: Record<string, F> } }[];
  return rows
    .filter((r) => r.document)
    .map(({ document }) => {
      const f = document!.fields;
      const id = document!.name.split('/').pop()!;
      const type = f.type?.stringValue ?? 'post';
      const text = f.text?.stringValue ?? '';
      const musicTitle = f.music?.mapValue?.fields?.title?.stringValue;
      return {
        title: musicTitle ? `♪ ${musicTitle}` : text.slice(0, 80) || type,
        link: `${siteUrl}/blog/p/${id}`,
        date: new Date(f.createdAt?.timestampValue ?? Date.now()),
        description: text,
      };
    });
}
try {
  items.push(...(await feedPosts()));
} catch (e) {
  console.warn(`rss: feed posts skipped (${(e as Error).message})`);
}
items.sort((a, b) => b.date.getTime() - a.date.getTime());
const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${x(site.siteTitle)}</title>
  <link>${siteUrl}</link>
  <description>${x(site.description)}</description>
  <language>${site.language}</language>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .slice(0, 40)
  .map(
    (i) => `  <item>
    <title>${x(i.title)}</title>
    <link>${i.link}</link>
    <guid>${i.link}</guid>
    <pubDate>${i.date.toUTCString()}</pubDate>
    <description>${x(i.description)}</description>
  </item>`,
  )
  .join('\n')}
</channel>
</rss>
`;
fs.writeFileSync(path.join(dist, 'rss.xml'), rss);

console.log(`Japanese font: ${jaFont.chars} characters, ${Math.round(jaFont.bytes / 1024)} kB`);
console.log(`prerendered ${count} pages (en, de, ja) + spa.html, 404.html, sitemap.xml, robots.txt, rss.xml (${items.length} RSS items) for ${siteUrl}`);
