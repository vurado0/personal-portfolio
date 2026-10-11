import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { adminHint, logOut } from '../lib/auth';
import { loginPrefetchProps } from '../lib/prefetch';
import { useContent } from '../lib/content';
import { useT } from '../i18n';

export function Footer() {
  const { profile } = useContent().content;
  const t = useT();
  // Read after mount so prerendered HTML and hydration match (same as the header).
  const [isAdmin, setIsAdmin] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setIsAdmin(adminHint()), [pathname]);
  return (
    <footer className="mt-24 border-t border-line/60 font-mono text-xs text-muted">
      <div className="container-page flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
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
            <button type="button" onClick={logOut} className="text-muted/70 hover:text-accent" title={t('header.logoutTitle')}>
              {t('footer.logout')}
            </button>
          ) : (
            <Link to="/login" className="text-muted/70 hover:text-accent" rel="nofollow" {...loginPrefetchProps}>
              {t('footer.login')}
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
