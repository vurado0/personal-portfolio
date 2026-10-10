import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { EditRoot } from '../lib/edit';
import { useSideTheme } from '../lib/theme';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout() {
  useSideTheme();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <EditRoot>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </EditRoot>
  );
}
