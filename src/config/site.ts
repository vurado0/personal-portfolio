import profile from '../../content/profile.json';
import type { Profile } from '../types/content';

// Central site configuration: the menu and deployment settings.
// Hiding a page = setting `enabled: false` (it disappears from the menu, sitemap and router).

export type Side = 'portfolio' | 'personal';

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: string;
  side: Side;
  order: number;
  enabled: boolean;
};

// Identity (name, role, socials, …) lives in content/profile.json so it can be edited from /admin.
export const site = {
  ...(profile as Profile),
  url: 'https://personal-portfolio.vercel.app',
  language: 'en',
  fonts: {
    // Any self-hosted family works here; JetBrains Mono and Inter Tight ship via @fontsource.
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    blog: '"Raptor Text", "Inter Tight", system-ui, sans-serif',
  },
};

export const nav: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: '~', side: 'portfolio', order: 1, enabled: true },
  { id: 'skills', label: 'Skills', path: '/skills', icon: '#', side: 'portfolio', order: 2, enabled: true },
  { id: 'knowhow', label: 'Know-how', path: '/knowhow', icon: '?', side: 'portfolio', order: 3, enabled: true },
  { id: 'projects', label: 'Projects', path: '/projects', icon: '{}', side: 'portfolio', order: 4, enabled: true },
  { id: 'blog', label: 'Blog', path: '/blog', icon: '¶', side: 'personal', order: 5, enabled: true },
  { id: 'hobbies', label: 'Hobbies', path: '/hobbies', icon: '*', side: 'personal', order: 6, enabled: true },
  { id: 'about', label: 'About / CV', path: '/about', icon: '@', side: 'portfolio', order: 7, enabled: true },
  { id: 'certificates', label: 'Certificates', path: '/certificates', icon: '✓', side: 'portfolio', order: 8, enabled: true },
  { id: 'contact', label: 'Contact', path: '/contact', icon: '✉', side: 'portfolio', order: 9, enabled: true },
];

export const enabledNav = nav.filter((item) => item.enabled).sort((a, b) => a.order - b.order);

export function isEnabled(id: string): boolean {
  return enabledNav.some((item) => item.id === id);
}

/** Path prefixes that belong to the personal (latte) side. */
export const personalPrefixes = nav.filter((i) => i.side === 'personal').map((i) => i.path);

export function sideForPath(pathname: string): Side {
  return personalPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
    ? 'personal'
    : 'portfolio';
}
