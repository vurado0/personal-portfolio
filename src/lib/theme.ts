import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { sideForPath } from '../config/site';
import { withViewTransition } from './view-transition';

export type Theme = 'light' | 'dark';

function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem('theme');
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1A120D' : '#EADBC8');
  listeners.forEach((fn) => fn());
}

/** Keeps data-side in sync with the route. The theme does not change on navigation: dark by default,
 *  light only when chosen with the toggle (saved), so moving between pages never flips it. */
export function useSideTheme() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.dataset.side = sideForPath(pathname);
    apply(savedTheme() ?? 'dark');
  }, [pathname]);
}

export function useTheme() {
  // Server snapshot is "dark"; the toggle renders both icons and CSS picks one, so hydration matches.
  const theme = useSyncExternalStore(subscribe, current, () => 'dark' as Theme);
  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode: theme still switches for this visit */
    }
    withViewTransition(() => apply(next));
  }, []);
  return { theme, toggle };
}
