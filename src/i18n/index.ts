// Interface language. English is the default and what is prerendered; the visitor's choice is kept
// in localStorage and applied right after hydration (the server snapshot is always English, so the
// prerendered HTML and the first client render match). German and Japanese (interface strings plus
// the content dictionary) are separate chunks, loaded only when that language is picked.
import { useCallback, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { withViewTransition } from '../lib/view-transition';
import { en, type MessageKey } from './en';

export type { MessageKey };
export type Locale = 'en' | 'de' | 'ja';

export const LOCALES: { id: Locale; label: string; short: string }[] = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'de', label: 'Deutsch', short: 'DE' },
  { id: 'ja', label: '日本語', short: 'JA' },
];

type Pack = { ui: Record<MessageKey, string>; content: Record<string, string> };
const packs: Partial<Record<Locale, Pack>> = {};
const loading: Partial<Record<Locale, Promise<void>>> = {};

function loadPack(locale: Locale): Promise<void> {
  if (locale === 'en' || packs[locale]) return Promise.resolve();
  loading[locale] ??= (
    locale === 'de'
      ? Promise.all([import('./de').then((m) => m.de), import('virtual:translations/de').then((m) => m.default)])
      : Promise.all([import('./ja').then((m) => m.ja), import('virtual:translations/ja').then((m) => m.default)])
  ).then(([ui, content]) => {
    packs[locale] = { ui, content };
  });
  loading[locale]!.catch(() => delete loading[locale]);
  return loading[locale]!;
}

const STORAGE_KEY = 'lang';
const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'de' || v === 'ja';

/** The language shown right now (its pack is loaded) and the one the visitor asked for. */
let active: Locale = 'en';
let wanted: Locale | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Switches the visible language; `fade` cross-fades it (a click), the initial restore does not. */
function show(locale: Locale, fade: boolean) {
  const swap = () => {
    active = locale;
    notify();
  };
  if (fade) withViewTransition(() => flushSync(swap));
  else swap();
}

function activate(locale: Locale, fade = false) {
  wanted = locale;
  loadPack(locale).then(
    () => {
      if (wanted !== locale) return;
      show(locale, fade);
    },
    () => {
      /* offline or blocked chunk: stay in English */
    },
  );
}

function readLocale(): Locale {
  if (wanted === null) {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked */
    }
    activate(isLocale(saved) ? saved : 'en');
  }
  return active;
}

export function setLocale(next: Locale) {
  try {
    if (next === 'en') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode: applies to this visit only */
  }
  document.documentElement.lang = next;
  if (next === 'en') {
    wanted = 'en';
    show('en', true);
  } else activate(next, true);
}

/** Warm the pack on hover so switching feels instant. */
export const preloadLocale = (locale: Locale) => void loadPack(locale).catch(() => {});

/** Content dictionary (English text → translation) of a loaded language. */
export function contentDictionary(locale: Locale): Record<string, string> | undefined {
  return packs[locale]?.content;
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Current interface language ('en' while prerendering and hydrating). */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, readLocale, () => 'en' as Locale);
}

export function translate(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  const template = (locale === 'en' ? undefined : packs[locale]?.ui[key]) ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** `t()` bound to the current language; components re-render when the language changes. */
export function useT(): Translate {
  const locale = useLocale();
  return useCallback((key, vars) => translate(locale, key, vars), [locale]);
}

/** Non-React callers (always English before hydration). */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return translate(typeof window === 'undefined' ? 'en' : readLocale(), key, vars);
}

/** BCP 47 tag for Intl formatting. */
export const intlLocale: Record<Locale, string> = { en: 'en-GB', de: 'de-AT', ja: 'ja-JP' };
