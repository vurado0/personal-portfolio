// Runs after `vite build` (client) and `vite build --ssr` (server bundle):
// prerenders portfolio pages + articles to static HTML and writes spa.html, sitemap.xml, robots.txt and rss.xml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';
import { enabledNav, isEnabled, sideForPath, site } from '../src/config/site.ts';
import type { HeadData } from '../src/types/head.ts';
import { loadContent } from './lib/content.ts';

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
  headToHtml: (data: HeadData, baseUrl: string) => string;
};
const entryFile = ['entry-server.js', 'entry-server.mjs'].map((f) => path.join(root, 'dist-ssr', f)).find((f) => fs.existsSync(f));
if (!entryFile) throw new Error('dist-ssr/entry-server.js not found — run `vite build --ssr src/entry-server.tsx --outDir dist-ssr` first');
const { render, headToHtml } = (await import(pathToFileURL(entryFile).href)) as ServerEntry;

const { bundle } = loadContent({ root, includeDrafts: false });
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// ---- Routes ---------------------------------------------------------------
const routes = new Set<string>(['/', '/impressum', '/datenschutz']);
for (const item of enabledNav) routes.add(item.path);
if (isEnabled('skills')) bundle.skills.forEach((s) => routes.add(`/skills/${s.id}`));
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

function page(html: string, head: string, pathname: string): string {
  return template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html)
    .replace('data-side="portfolio"', `data-side="${sideForPath(pathname)}"`);
}

// SPA fallback for runtime-only routes (/blog/p/:id, /admin, unknown URLs): empty root, generic head.
fs.writeFileSync(path.join(dist, 'spa.html'), page('', headToHtml({ path: '/' }, siteUrl), '/'));

let count = 0;
for (const url of routes) {
  const { html, head } = await render(url);
  const file = url === '/' ? path.join(dist, 'index.html') : path.join(dist, `${url.slice(1)}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(html, headToHtml({ ...head, path: url }, siteUrl), url));
  count++;
}
const notFound = await render('/__not-found__');
fs.writeFileSync(path.join(dist, '404.html'), page(notFound.html, headToHtml({ ...notFound.head, path: '/404' }, siteUrl), '/404'));

// ---- sitemap.xml / robots.txt --------------------------------------------
const lastmod: Record<string, string> = {};
bundle.knowhow.forEach((d) => (lastmod[d.url] = d.updated));
bundle.articles.forEach((a) => (lastmod[a.url] = a.date));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...routes]
  .map((u) => `  <url><loc>${siteUrl}${u === '/' ? '' : u}</loc>${lastmod[u] ? `<lastmod>${lastmod[u]}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

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
  <title>${x(site.name)}</title>
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

console.log(`prerendered ${count} pages + spa.html, 404.html, sitemap.xml, robots.txt, rss.xml (${items.length} RSS items) for ${siteUrl}`);
