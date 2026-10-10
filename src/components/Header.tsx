import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { enabledNav, site, type NavItem } from '../config/site';
import { t } from '../i18n';
import { adminHint } from '../lib/auth';
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

export function Header() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  // Read after mount so prerendered HTML and hydration match.
  useEffect(() => setIsAdmin(adminHint()), [pathname]);

  const portfolio = enabledNav.filter((i) => i.side === 'portfolio');
  const personal = enabledNav.filter((i) => i.side === 'personal');

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="font-mono text-sm font-bold text-fg no-underline hover:no-underline" aria-label={`${site.name} — home`}>
          <span className="text-accent">~/</span>
          {site.handle}
          <span className="ml-0.5 inline-block w-2 animate-pulse text-accent">_</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center whitespace-nowrap font-mono xl:flex">
          {portfolio.map((i) => (
            <Item key={i.id} item={i} />
          ))}
          {personal.length > 0 && <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />}
          {personal.map((i) => (
            <Item key={i.id} item={i} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && !pathname.startsWith('/admin') ? (
            <Link to="/admin" className="chip min-h-11 border-accent px-3 text-accent hover:no-underline">
              admin
            </Link>
          ) : null}
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
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line/60 bg-bg font-mono xl:hidden">
          <div className="container-page grid gap-1 py-3 sm:grid-cols-2">
            <p className="label col-span-full px-2.5 pt-1">// portfolio</p>
            {portfolio.map((i) => (
              <Item key={i.id} item={i} onClick={() => setOpen(false)} />
            ))}
            {personal.length > 0 && <p className="label col-span-full px-2.5 pt-3">// personal</p>}
            {personal.map((i) => (
              <Item key={i.id} item={i} onClick={() => setOpen(false)} />
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
