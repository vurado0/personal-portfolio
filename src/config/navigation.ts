// Fixed part of the menu (paths, icons, which side a page belongs to). Labels, order and
// visibility are content: content/navigation.json, editable from the site in edit mode.

export type Side = 'portfolio' | 'personal';

export type NavDefault = { id: string; path: string; icon: string; side: Side; label: string };

export type NavOverride = { id: string; label: string; enabled: boolean };

export type NavItem = NavDefault & { enabled: boolean; order: number };

export const NAV_DEFAULTS: NavDefault[] = [
  { id: 'home', label: 'Home', path: '/', icon: '~', side: 'portfolio' },
  { id: 'skills', label: 'Skills', path: '/skills', icon: '#', side: 'portfolio' },
  { id: 'knowhow', label: 'Know-how', path: '/knowhow', icon: '?', side: 'portfolio' },
  { id: 'projects', label: 'Projects', path: '/projects', icon: '{}', side: 'portfolio' },
  { id: 'blog', label: 'Blog', path: '/blog', icon: '¶', side: 'personal' },
  { id: 'hobbies', label: 'Hobbies', path: '/hobbies', icon: '*', side: 'personal' },
  { id: 'about', label: 'About / CV', path: '/about', icon: '@', side: 'portfolio' },
  { id: 'certificates', label: 'Certificates', path: '/certificates', icon: '✓', side: 'portfolio' },
  { id: 'contact', label: 'Contact', path: '/contact', icon: '✉', side: 'portfolio' },
];

/** Merges content/navigation.json over the defaults. Home is always visible. */
export function buildNav(overrides: NavOverride[]): NavItem[] {
  const known = new Map(NAV_DEFAULTS.map((d) => [d.id, d]));
  const seen = new Set<string>();
  const items: NavItem[] = [];
  for (const o of overrides) {
    const d = known.get(o.id);
    if (!d || seen.has(o.id)) continue;
    seen.add(o.id);
    items.push({ ...d, label: o.label?.trim() || d.label, enabled: d.id === 'home' || o.enabled !== false, order: items.length + 1 });
  }
  for (const d of NAV_DEFAULTS) if (!seen.has(d.id)) items.push({ ...d, enabled: true, order: items.length + 1 });
  return items;
}
