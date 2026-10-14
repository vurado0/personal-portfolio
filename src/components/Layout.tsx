import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { EditRoot } from '../lib/edit';
import { useSideTheme } from '../lib/theme';
import { Footer } from './Footer';
import { Header } from './Header';
import { SearchRoot } from './Search';

export function Layout() {
  useSideTheme();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Jump (not smooth-scroll) to the top on a new page; in-page anchors still scroll smoothly.
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <EditRoot>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          {/* Keyed by path so the staggered entrance (see .page-enter in index.css) replays on every page. */}
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
      <SearchRoot />
    </EditRoot>
  );
}
