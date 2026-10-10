// UI strings. English is the default; add e.g. de.ts with the same keys to localise.
export const en = {
  'nav.menu': 'Menu',
  'nav.close': 'Close menu',
  'theme.toggle': 'Toggle dark / light mode',
  'footer.impressum': 'Impressum',
  'footer.privacy': 'Datenschutz',
  'footer.rss': 'RSS',
  'feed.empty': 'No posts yet — the first cup is still brewing.',
  'feed.notConfigured': 'The feed is not connected yet (Firebase environment variables are missing).',
  'feed.error': 'The feed could not be loaded right now.',
  'music.play': 'Play preview',
  'music.consent': 'Loads the {provider} player. {provider} may set cookies and receives your IP address.',
  'common.loading': 'Loading…',
  'common.back': 'Back',
} as const;

export type MessageKey = keyof typeof en;
