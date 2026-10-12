import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { buildNav, type NavItem } from '../config/navigation';
import { useContent } from '../lib/content';
import { EditButton, setEditMode, useEditModeOn } from '../lib/edit';
import { useT } from '../i18n';
import { adminHint, logOut } from '../lib/auth';
import { loginPrefetchProps } from '../lib/prefetch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

function Item({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm no-underline transition-colors hover:text-accent hover:no-underline ${
          isActive ? 'text-accent' : 'text-fg'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span aria-hidden="true" className="w-4 text-center font-mono text-xs text-muted">
            {isActive ? '>' : item.icon}
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  );
}

/** Owner-only menu tab (shown after an admin login on this device; /admin itself still checks the login). */
const ADMIN_ITEM: NavItem = { id: 'admin', label: 'Admin', path: '/admin', icon: '⚙', side: 'portfolio', enabled: true, order: 999 };

export function Header() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const editing = useEditModeOn();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  // Read after mount so prerendered HTML and hydration match.
  useEffect(() => setIsAdmin(adminHint()), [pathname, editing]);

  const { content } = useContent();
  const t = useT();
  const adminItem = { ...ADMIN_ITEM, label: t('nav.admin') };
  const items = buildNav(content.navigation).filter((i) => i.enabled);
  const portfolio = items.filter((i) => i.side === 'portfolio');
  const personal = items.filter((i) => i.side === 'personal');

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="whitespace-nowrap font-mono text-sm font-bold text-fg no-underline hover:no-underline" aria-label={`${content.profile.name} — home`}>
          {content.profile.name}
          <span className="ml-0.5 inline-block w-2 animate-pulse text-accent" aria-hidden="true">
            _
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center whitespace-nowrap font-mono xl:flex">
          {portfolio.map((i) => (
            <Item key={i.id} item={i} />
          ))}
          {personal.length > 0 && <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />}
          {personal.map((i) => (
            <Item key={i.id} item={i} />
          ))}
          {isAdmin ? (
            <>
              <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />
              <Item item={adminItem} />
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <EditButton target={{ kind: 'nav' }} label="menu" />
          {isAdmin ? (
            pathname.startsWith('/admin') ? null : editing ? (
              <button type="button" onClick={() => setEditMode(false)} className="chip min-h-11 min-w-11 justify-center whitespace-nowrap border-accent bg-accent px-3 text-on-accent" aria-label={t('header.done')}>
                {/* Phones only get the symbol, so the language button still fits next to it. */}
                <span className="sm:hidden" aria-hidden="true">✓</span>
                <span className="hidden sm:inline">{t('header.done')}</span>
              </button>
            ) : (
              <button type="button" onClick={() => setEditMode(true)} className="chip min-h-11 min-w-11 justify-center border-accent px-3 text-accent" title={t('header.editTitle')} aria-label={t('header.edit')}>
                <span aria-hidden="true">✎</span>
              </button>
            )
          ) : pathname !== '/login' ? (
            <Link
              to={`/login?next=${encodeURIComponent(pathname)}&edit=1`}
              className="chip hidden min-h-11 whitespace-nowrap px-3 text-fg hover:border-accent hover:no-underline sm:inline-flex"
              rel="nofollow"
              {...loginPrefetchProps}
            >
              {t('header.signIn')}
            </Link>
          ) : null}
          {isAdmin ? (
            <button type="button" onClick={logOut} className="chip hidden min-h-11 whitespace-nowrap px-3 text-fg hover:border-accent sm:inline-flex" title={t('header.logoutTitle')}>
              {t('header.logout')}
            </button>
          ) : null}
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line/70 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t('nav.close') : t('nav.menu')}
            onClick={() => setOpen((o) => !o)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="menu-enter border-t border-line/60 bg-bg font-mono xl:hidden">
          <div className="container-page grid gap-1 py-3 sm:grid-cols-2">
            <p className="label col-span-full px-2.5 pt-1">{t('nav.portfolio')}</p>
            {portfolio.map((i) => (
              <Item key={i.id} item={i} onClick={() => setOpen(false)} />
            ))}
            {personal.length > 0 && <p className="label col-span-full px-2.5 pt-3">{t('nav.personal')}</p>}
            {personal.map((i) => (
              <Item key={i.id} item={i} onClick={() => setOpen(false)} />
            ))}
            {isAdmin ? (
              <>
                <p className="label col-span-full px-2.5 pt-3">{t('nav.owner')}</p>
                <Item item={adminItem} onClick={() => setOpen(false)} />
              </>
            ) : null}
            {!isAdmin && pathname !== '/login' ? (
              <Link
                to={`/login?next=${encodeURIComponent(pathname)}&edit=1`}
                rel="nofollow"
                {...loginPrefetchProps}
                className="col-span-full mt-2 flex min-h-11 items-center rounded-sm border-t border-line/60 px-2 pt-2 text-sm text-muted no-underline hover:text-accent hover:no-underline sm:hidden"
              >
                {t('header.signIn')} →
              </Link>
            ) : null}
            {isAdmin ? (
              <button type="button" onClick={logOut} className="col-span-full mt-2 flex min-h-11 items-center rounded-sm border-t border-line/60 px-2 pt-2 text-left text-sm text-muted hover:text-accent">
                ⏻ {t('header.logout')}
              </button>
            ) : null}
          </div>
        </nav>
      )}
    </header>
  );
}
