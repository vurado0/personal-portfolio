import { Link } from 'react-router';
import { Background } from '../components/Background';
import { Seo } from '../lib/head';
import { useT } from '../i18n';

export default function NotFound() {
  const t = useT();
  return (
    <>
      <Seo title="Not found" noindex />
      <Background name="coffee-waves" className="min-h-[70vh]">
        <div className="container-page flex min-h-[70vh] flex-col items-start justify-center py-20">
          <p className="font-mono text-sm text-muted">
            <span className="text-accent">$</span> cat this-page
          </p>
          <h1 className="blog-headline mt-4 text-7xl sm:text-9xl">404</h1>
          <p className="mt-4 max-w-md text-lg">{t('notFound.text')}</p>
          <Link to="/" className="btn-primary mt-8">
            {t('notFound.back')}
          </Link>
        </div>
      </Background>
    </>
  );
}
