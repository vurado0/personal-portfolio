// Used by scripts/prerender.ts to render portfolio pages and articles to static HTML at build time.
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { App } from './App';
import { localePrefix, prepareLocale, splitLocalePath } from './i18n';
import { HeadProvider, type HeadData } from './lib/head';

export async function render(url: string): Promise<{ html: string; head: HeadData }> {
  const collector: { data: HeadData } = { data: {} };
  const { locale } = splitLocalePath(url);
  await prepareLocale(locale);
  const { prelude } = await prerender(
    <StrictMode>
      <HeadProvider collector={collector}>
        <StaticRouter location={url} basename={localePrefix(locale) || '/'}>
          <App />
        </StaticRouter>
      </HeadProvider>
    </StrictMode>,
  );
  const html = await new Response(prelude).text();
  return { html, head: collector.data };
}

export { headToHtml } from './lib/head';
