import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/inter-tight/900.css';
import './styles/index.css';
import { App } from './App';
import { HeadProvider } from './lib/head';

if (__HAS_RAPTOR__) import('./styles/raptor.css');

const app = (
  <StrictMode>
    <HeadProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HeadProvider>
  </StrictMode>
);

const root = document.getElementById('root')!;
// Prerendered pages are hydrated; the SPA fallback (spa.html) renders from scratch.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
