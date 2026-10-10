const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Formats a YYYY-MM-DD string (timezone-stable for prerendering). */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso));
}

export function formatDateTime(d: Date): string {
  return dateTimeFmt.format(d);
}

export function relativeTime(d: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d`;
  return dateFmt.format(d);
}
