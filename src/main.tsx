import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/inter-tight/900.css';
import './styles/index.css';
import { App } from './App';
import { prepareLocale, splitLocalePath } from './i18n';
import { HeadProvider } from './lib/head';
import { LocaleRouter } from './lib/locale-router';

if (__HAS_RAPTOR__) import('./styles/raptor.css');

const app = (
  <StrictMode>
    <HeadProvider>
      <LocaleRouter>
        <App />
      </LocaleRouter>
    </HeadProvider>
  </StrictMode>
);

function start() {
  const root = document.getElementById('root')!;
  // Prerendered pages are hydrated; the SPA fallback (spa.html) renders from scratch.
  if (root.firstElementChild) hydrateRoot(root, app);
  else createRoot(root).render(app);
}

// /de/… and /ja/… pages were prerendered in that language: load it first so hydration matches.
prepareLocale(splitLocalePath(location.pathname).locale).then(start, () => prepareLocale('en').then(start));
