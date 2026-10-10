import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { site } from '../config/site';
import type { HeadData } from '../types/head';

export type { HeadData };

type Collector = { data: HeadData };

const HeadContext = createContext<Collector | null>(null);

/** During prerendering, collects the last <Seo> data so scripts/prerender.ts can write it into <head>. */
export function HeadProvider({ collector, children }: { collector?: Collector; children: ReactNode }) {
  return <HeadContext.Provider value={collector ?? null}>{children}</HeadContext.Provider>;
}

/** The browser tab always shows the site title; link previews still name the page. */
export function fullTitle(): string {
  return site.siteTitle;
}

export function previewTitle(title?: string): string {
  return title ? `${title} · ${site.siteTitle}` : `${site.siteTitle} — ${site.name}`;
}

function absolute(url: string, base: string): string {
  return /^https?:\/\//.test(url) ? url : base.replace(/\/$/, '') + url;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Serialises head data to HTML tags (used by the prerender script). */
export function headToHtml(data: HeadData, baseUrl: string): string {
  const title = fullTitle();
  const ogTitle = previewTitle(data.title);
  const description = data.description ?? site.description;
  const url = absolute(data.path ?? '/', baseUrl);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:title" content="${esc(ogTitle)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:type" content="${data.type ?? 'website'}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:site_name" content="${esc(site.siteTitle)}">`,
    `<meta name="twitter:card" content="${data.image ? 'summary_large_image' : 'summary'}">`,
  ];
  if (data.image) tags.push(`<meta property="og:image" content="${esc(absolute(data.image, baseUrl))}">`);
  if (data.noindex) tags.push('<meta name="robots" content="noindex">');
  return tags.join('\n    ');
}

function setMeta(attr: 'name' | 'property', key: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/** Per-page title, description and Open Graph tags (prerendered, then kept in sync on the client). */
export function Seo(props: HeadData) {
  const collector = useContext(HeadContext);
  if (collector) collector.data = props;

  useEffect(() => {
    const description = props.description ?? site.description;
    document.title = fullTitle();
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', previewTitle(props.title));
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', props.type ?? 'website');
    setMeta('property', 'og:url', location.href);
    setMeta('property', 'og:image', props.image ? absolute(props.image, location.origin) : undefined);
    setMeta('name', 'robots', props.noindex ? 'noindex' : undefined);
  }, [props.title, props.description, props.image, props.type, props.noindex]);

  return null;
}
