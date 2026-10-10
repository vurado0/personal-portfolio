import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { useContent } from '../lib/content';
import { firebaseConfigured } from '../lib/env';
import { sendMessage } from '../lib/feed';
import { Seo } from '../lib/head';

const RATE_KEY = 'contact-sent';
const MAX_PER_HOUR = 3;

/** Simple client-side rate limit: max 3 messages per hour per browser. */
function recentSends(): number[] {
  try {
    const list = JSON.parse(localStorage.getItem(RATE_KEY) ?? '[]') as number[];
    return list.filter((t) => Date.now() - t < 3_600_000);
  } catch {
    return [];
  }
}

export default function Contact() {
  const site = useContent().content.profile;
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'limited'>('idle');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Honeypot: real visitors never see or fill this field.
    if (form.get('website')) {
      setStatus('sent');
      return;
    }
    const sends = recentSends();
    if (sends.length >= MAX_PER_HOUR) {
      setStatus('limited');
      return;
    }
    setStatus('sending');
    try {
      await sendMessage({
        name: String(form.get('name') ?? '').trim().slice(0, 200),
        email: String(form.get('email') ?? '').trim().slice(0, 200),
        message: String(form.get('message') ?? '').trim().slice(0, 4900),
      });
      try {
        localStorage.setItem(RATE_KEY, JSON.stringify([...sends, Date.now()]));
      } catch {
        /* ignore */
      }
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <>
      <Seo title="Contact" description={`Get in touch with ${site.name}.`} path="/contact" />
      <PageHeader pageId="contact" label="contact" title="Say hello">
        Questions, opportunities or just a coffee recommendation — write me a message.
      </PageHeader>
      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_18rem]">
        {firebaseConfigured ? (
          <form onSubmit={onSubmit} className="max-w-xl space-y-5">
            <div>
              <label htmlFor="c-name" className="label mb-1.5 block">
                name
              </label>
              <input id="c-name" name="name" required maxLength={200} autoComplete="name" className="input" />
            </div>
            <div>
              <label htmlFor="c-email" className="label mb-1.5 block">
                email
              </label>
              <input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" />
            </div>
            <div>
              <label htmlFor="c-message" className="label mb-1.5 block">
                message
              </label>
              <textarea id="c-message" name="message" required minLength={10} maxLength={4900} rows={6} className="input" />
            </div>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="c-website">Website</label>
              <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <p className="text-xs text-muted">
              Your message is stored in Firebase (Google Cloud, EU) so I can answer it. See <Link to="/datenschutz">Datenschutz</Link>.
            </p>
            <button type="submit" className="btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <p role="status" className="font-mono text-sm">
              {status === 'sent' && <span className="text-accent">✓ Thanks! Your message is in my inbox.</span>}
              {status === 'error' && 'Something went wrong. Please use email instead.'}
              {status === 'limited' && 'You have sent several messages already — please try again later or use email.'}
            </p>
          </form>
        ) : (
          <p className="text-muted">The contact form is not connected yet. Please use email.</p>
        )}
        <aside className="font-mono text-sm">
          <p className="section-title mb-3">elsewhere</p>
          <ul className="space-y-2">
            {site.socials.map((s) => (
              <li key={s.id}>
                <a href={s.url} {...(s.url.startsWith('http') ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}>
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
