import { intlLocale, translate, type Locale } from '../i18n';

const dateFmts = new Map<Locale, Intl.DateTimeFormat>();
const dateTimeFmts = new Map<Locale, Intl.DateTimeFormat>();

function dateFmt(locale: Locale) {
  let f = dateFmts.get(locale);
  if (!f) dateFmts.set(locale, (f = new Intl.DateTimeFormat(intlLocale[locale], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })));
  return f;
}

/** Formats a YYYY-MM-DD string (timezone-stable for prerendering). */
export function formatDate(iso: string, locale: Locale = 'en'): string {
  return dateFmt(locale).format(new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso));
}

export function formatDateTime(d: Date, locale: Locale = 'en'): string {
  let f = dateTimeFmts.get(locale);
  if (!f)
    dateTimeFmts.set(locale, (f = new Intl.DateTimeFormat(intlLocale[locale], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })));
  return f.format(d);
}

export function relativeTime(d: Date, locale: Locale = 'en', now = new Date()): string {
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return translate(locale, 'time.justNow');
  const m = Math.round(s / 60);
  if (m < 60) return translate(locale, 'time.minutes', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return translate(locale, 'time.hours', { n: h });
  const days = Math.round(h / 24);
  if (days < 7) return translate(locale, 'time.days', { n: days });
  return dateFmt(locale).format(d);
}
