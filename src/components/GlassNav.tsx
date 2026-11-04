// The navigation layer in Liquid Glass (Glisse): the wallpaper, a floating top bar and an iOS-style
// tab bar. As on iOS 26, only this layer is glass; page content sits on a frosted CSS material.
// The bars never move against the wallpaper they bend, so nothing is refiltered while scrolling,
// and content never binds to the wallpaper (Glisse looks for it among a glass's ancestors, and
// the wallpaper lives only inside this layer).
import { forwardRef, startTransition, useEffect, useState, type AnchorHTMLAttributes, type ComponentType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Glass, Menu, SegmentedControl, Switch, TabBar, type MenuEntry } from 'glisse';
import { buildNav, type NavItem } from '../config/navigation';
import { isEnabled } from '../config/site';
import { LOCALES, setLocale, useLocale, useT } from '../i18n';
import { adminHint, logOut } from '../lib/auth';
import { useContent } from '../lib/content';
import { setEditMode, useEdit, useEditModeOn } from '../lib/edit';
import { prefetchLogin } from '../lib/prefetch';
import { useTheme } from '../lib/theme';
import {
  BookIcon,
  CertificateIcon,
  CheckIcon,
  EditIcon,
  GearIcon,
  HeartIcon,
  HomeIcon,
  LoginIcon,
  LogoutIcon,
  MailIcon,
  MoonIcon,
  PenIcon,
  PersonIcon,
  ProjectsIcon,
  SearchIcon,
  SkillsIcon,
  SunIcon,
} from './icons';
import { openSearch, preloadSearch } from './Search';

/** The five sections in the tab bar; every other page is in the ⋯ menu. */
const TABS: { id: string; icon: ComponentType }[] = [
  { id: 'home', icon: HomeIcon },
  { id: 'projects', icon: ProjectsIcon },
  { id: 'knowhow', icon: BookIcon },
  { id: 'blog', icon: PenIcon },
  { id: 'about', icon: PersonIcon },
];
const MENU_ICONS: Record<string, ComponentType> = { skills: SkillsIcon, hobbies: HeartIcon, certificates: CertificateIcon, contact: MailIcon };

/** Glisse renders tab links as <Link href>; React Router's Link wants `to`. The page swap runs as a
 *  transition, so the tab bar's selection animation is never blocked by rendering the new page. */
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink({ href = '/', onClick, ...props }, ref) {
  const navigate = useNavigate();
  return (
    <Link
      ref={ref}
      to={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        startTransition(() => navigate(href));
      }}
    />
  );
});

const sectionOf = (pathname: string, items: NavItem[]) =>
  items.find((i) => (i.path === '/' ? pathname === '/' : pathname === i.path || pathname.startsWith(`${i.path}/`)))?.id ?? null;

export function GlassNav() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { content } = useContent();
  const { theme, toggle } = useTheme();
  const edit = useEdit();
  const editing = useEditModeOn();
  const [isAdmin, setIsAdmin] = useState(false);
  // Read after mount so prerendered HTML and hydration match.
  useEffect(() => setIsAdmin(adminHint()), [pathname, editing]);

  const items = buildNav(content.navigation).filter((i) => i.enabled && isEnabled(i.id));
  const tabs = TABS.map((tab) => ({ tab, item: items.find((i) => i.id === tab.id) })).filter((x): x is { tab: (typeof TABS)[number]; item: NavItem } => Boolean(x.item));
  const more = items.filter((i) => !TABS.some((tab) => tab.id === i.id));
  const current = sectionOf(pathname, tabs.map((x) => x.item));
  const go = (path: string) => path !== pathname && navigate(path);

  const menu: MenuEntry[] = [
    ...more.map((i) => {
      const Icon = MENU_ICONS[i.id] ?? SkillsIcon;
      return { label: i.label, icon: <Icon />, onSelect: () => go(i.path) };
    }),
    'separator',
    ...LOCALES.filter((l) => l.id !== locale).map((l) => ({ label: l.label, icon: <span className="font-mono text-xs font-bold">{l.short}</span>, onSelect: () => setLocale(l.id) })),
    'separator',
    ...(isAdmin
      ? [
          { label: t('nav.admin'), icon: <GearIcon />, onSelect: () => go('/admin') },
          ...(edit ? [{ label: t('nav.editMenu'), icon: <EditIcon />, onSelect: () => edit.open({ kind: 'nav' }) }] : []),
          { label: t('header.logout'), icon: <LogoutIcon />, onSelect: () => void logOut() },
        ]
      : [{ label: t('header.signIn'), icon: <LoginIcon />, onSelect: () => (prefetchLogin(), go(`/login?next=${encodeURIComponent(pathname)}&edit=1`)) }]),
  ];

  return (
    <div className="nav-layer">
      {/* Two copies of the wallpaper: the glass bends the top one through an SVG filter. Safari
          paints nothing of a filtered element outside the filter's region (e.g. for a moment while
          the tab bar's lens moves), so the plain copy below fills in exactly the same picture. */}
      <div className="wallpaper" aria-hidden="true" />
      <div className="wallpaper" data-glisse-backdrop aria-hidden="true" />
      <div className="scroll-edge scroll-edge-top" aria-hidden="true" />
      <div className="scroll-edge scroll-edge-bottom" aria-hidden="true" />

      <header className="top-bar">
        <Glass className="glass-pill flex min-w-0">
          <Link to="/" className="flex h-full items-center whitespace-nowrap px-[18px] font-mono text-sm font-bold text-fg no-underline hover:no-underline" aria-label={`${content.profile.name} — home`}>
            {content.profile.name}
            <span className="caret text-accent" aria-hidden="true">
              _
            </span>
          </Link>
        </Glass>
        <div className="flex items-center gap-2">
          <Button icon={<SearchIcon />} aria-label={t('search.open')} aria-keyshortcuts="Meta+K Control+K /" onClick={openSearch} onPointerEnter={preloadSearch} onFocus={preloadSearch} />
          <div className="hidden md:block">
            <SegmentedControl aria-label={t('lang.title')} items={LOCALES.map((l) => ({ value: l.id, label: l.short }))} value={locale} onValueChange={(v) => setLocale(v as typeof locale)} />
          </div>
          <Glass className="glass-pill hidden items-center gap-2 px-3 sm:flex">
            <SunIcon />
            <Switch aria-label={t('theme.toggle')} checked={theme === 'dark'} onCheckedChange={() => toggle()} />
            <MoonIcon />
          </Glass>
          {isAdmin && !pathname.startsWith('/admin') ? (
            <Button
              icon={editing ? <CheckIcon /> : <EditIcon />}
              variant={editing ? 'filled' : 'glass'}
              aria-label={editing ? t('header.done') : t('header.edit')}
              title={editing ? t('header.done') : t('header.editTitle')}
              onClick={() => setEditMode(!editing)}
            />
          ) : null}
          <Menu
            aria-label={t('nav.menu')}
            align="end"
            items={[
              // Phones have no room for the theme switch in the bar.
              { label: t(theme === 'dark' ? 'nav.lightMode' : 'nav.darkMode'), icon: theme === 'dark' ? <SunIcon /> : <MoonIcon />, onSelect: toggle },
              ...menu,
            ]}
          />
        </div>
      </header>

      <nav className="tab-bar" aria-label="Main">
        <TabBar
          aria-label="Main"
          link={RouterLink}
          value={current}
          onValueChange={(id) => {
            const item = tabs.find((x) => x.item.id === id)?.item;
            if (item && sectionOf(pathname, [item]) !== id) startTransition(() => navigate(item.path));
          }}
          items={tabs.map(({ tab, item }) => ({ value: item.id, label: item.label.split(' / ')[0], icon: <tab.icon />, href: item.path }))}
        />
      </nav>
    </div>
  );
}
