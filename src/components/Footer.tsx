import { Link } from 'react-router';
import { useContent } from '../lib/content';
import { t } from '../i18n';

export function Footer() {
  const { profile } = useContent().content;
  return (
    <footer className="mt-24 border-t border-line/60 font-mono text-xs text-muted">
      <div className="container-page flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.name} <span className="text-accent">·</span> brewed with React & coffee
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
          <Link to="/login" className="text-muted/70 hover:text-accent" rel="nofollow">
            Login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
