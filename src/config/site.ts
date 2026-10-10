// Central site configuration. Identity comes from content/profile.json and the menu from
// content/navigation.json (both editable on the site in edit mode); this file only adds
// deployment settings and helpers.
import navigation from '../../content/navigation.json';
import profile from '../../content/profile.json';
import type { Profile } from '../types/content';
import { buildNav, NAV_DEFAULTS, type NavItem, type NavOverride } from './navigation';

export type { NavItem, Side } from './navigation';

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

/** Menu as built (decides which routes exist). Hiding a page = `enabled: false` in navigation.json. */
export const nav: NavItem[] = buildNav(navigation as NavOverride[]);

export const enabledNav = nav.filter((item) => item.enabled);

export function isEnabled(id: string): boolean {
  return enabledNav.some((item) => item.id === id);
}

/** Path prefixes that belong to the personal (latte) side. */
export const personalPrefixes = NAV_DEFAULTS.filter((i) => i.side === 'personal').map((i) => i.path);

export function sideForPath(pathname: string): 'portfolio' | 'personal' {
  return personalPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/')) ? 'personal' : 'portfolio';
}
