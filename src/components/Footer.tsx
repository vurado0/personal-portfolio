import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { adminHint, logOut } from '../lib/auth';
import { loginPrefetchProps } from '../lib/prefetch';
import { useContent } from '../lib/content';
import { buildNav } from '../config/navigation';
import { isEnabled } from '../config/site';
import { useT } from '../i18n';

export function Footer() {
  const { profile, navigation } = useContent().content;
  // Every page as a plain link (the ⋯ menu is not in the HTML): for search engines and as a sitemap.
  const pages = buildNav(navigation).filter((i) => i.enabled && isEnabled(i.id));
  const t = useT();
  // Read after mount so prerendered HTML and hydration match (same as the header).
  const [isAdmin, setIsAdmin] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setIsAdmin(adminHint()), [pathname]);
  return (
    <footer className="relative z-[1] mt-20 pb-28 font-mono text-xs text-muted">
      <div className="container-page">
        <div className="material-thin space-y-4 rounded-[24px] px-6 py-5">
          <nav aria-label={t('footer.pages')} className="flex flex-wrap gap-x-5 gap-y-2 border-b border-fg/10 pb-4 font-ui text-sm">
            {pages.map((i) => (
              <Link key={i.id} to={i.path} className="text-fg/80 no-underline hover:text-accent">
                {i.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {profile.name} <span className="text-accent">·</span> {t('footer.brewed')}
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {profile.socials.map((s) => (
              <a key={s.id} href={s.url} className="text-muted hover:text-accent" {...(s.url.startsWith('http') ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}>
                {s.label}
              </a>
            ))}
            <a href="/rss.xml" className="text-muted hover:text-accent">
              {t('footer.rss')}
            </a>
            <Link to="/impressum" className="text-muted hover:text-accent">
              {t('footer.impressum')}
            </Link>
            <Link to="/datenschutz" className="text-muted hover:text-accent">
              {t('footer.privacy')}
            </Link>
            {isAdmin ? (
              <button type="button" onClick={logOut} className="text-muted hover:text-accent" title={t('header.logoutTitle')}>
                {t('footer.logout')}
              </button>
            ) : (
              <Link to="/login" className="text-muted hover:text-accent" rel="nofollow" {...loginPrefetchProps}>
                {t('footer.login')}
              </Link>
            )}
          </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
