// Simple client-side rate limit for the contact form and CV requests: max 3 messages per hour per browser.
const RATE_KEY = 'contact-sent';
const MAX_PER_HOUR = 3;

function recentSends(): number[] {
  try {
    const list = JSON.parse(localStorage.getItem(RATE_KEY) ?? '[]') as number[];
    return list.filter((t) => Date.now() - t < 3_600_000);
  } catch {
    return [];
  }
}

export const sendLimitReached = () => recentSends().length >= MAX_PER_HOUR;

export function recordSend() {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify([...recentSends(), Date.now()]));
  } catch {
    /* ignore */
  }
}
