import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useT } from '../i18n';
import { firebaseConfigured } from '../lib/env';
import { sendMessage } from '../lib/feed';
import { recordSend, sendLimitReached } from '../lib/send-limit';

/**
 * The CV (PDF with phone and address) is not public: visitors request it and the owner answers by
 * email. Requests are stored like contact messages (same Firestore rules), marked "[CV request]".
 */
export function CvRequest({ email }: { email: string }) {
  const t = useT();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'limited'>('idle');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get('website')) return setStatus('sent'); // honeypot
    if (sendLimitReached()) return setStatus('limited');
    const company = String(form.get('company') ?? '').trim().slice(0, 200);
    const note = String(form.get('note') ?? '').trim().slice(0, 4000);
    setStatus('sending');
    try {
      await sendMessage({
        name: String(form.get('name') ?? '').trim().slice(0, 200),
        email: String(form.get('email') ?? '').trim().slice(0, 200),
        message: `[CV request]${company ? ` · ${company}` : ''}\n\n${note || '—'}`,
      });
      recordSend();
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <section id="cv-request" aria-labelledby="cv-request-title" className="card scroll-mt-24 space-y-3">
      <h2 id="cv-request-title" className="section-title">
        {t('cvreq.title')}
      </h2>
      <p className="text-sm text-muted">{t('cvreq.text')}</p>
      {!firebaseConfigured ? (
        <a href={`mailto:${email}?subject=CV%20request`} className="btn-primary w-full">
          {t('cvreq.byEmail')}
        </a>
      ) : status === 'sent' ? (
        <p role="status" className="font-mono text-sm text-accent">
          {t('cvreq.sent')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input name="name" required maxLength={200} autoComplete="name" placeholder={t('cvreq.name')} aria-label={t('cvreq.name')} className="input" />
          <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder={t('cvreq.email')} aria-label={t('cvreq.email')} className="input" />
          <input name="company" maxLength={200} autoComplete="organization" placeholder={t('cvreq.company')} aria-label={t('cvreq.company')} className="input" />
          <textarea name="note" maxLength={4000} rows={2} placeholder={t('cvreq.note')} aria-label={t('cvreq.note')} className="input" />
          <div className="hidden" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
            {status === 'sending' ? t('contact.sending') : t('cvreq.send')}
          </button>
          {status === 'error' || status === 'limited' ? (
            <p role="status" className="text-sm">
              {t(status === 'error' ? 'contact.error' : 'contact.limited')}
            </p>
          ) : null}
          <p className="text-xs text-muted">
            {t('contact.privacy')} <Link to="/datenschutz">Datenschutz</Link>.
          </p>
        </form>
      )}
    </section>
  );
}
