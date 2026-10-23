// Interface language. The URL decides it: English has no prefix, German and Japanese live under
// /de/… and /ja/… (prerendered in that language, so search engines index them). German and Japanese
// (interface strings plus the content dictionary) are separate chunks, loaded before the first render
// of such a page and otherwise only when that language is picked. A saved choice (localStorage) sends
// a visitor who opens an English URL to their language.
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

/** Splits "/de/skills" into the language and the path inside it ("/skills"). */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const m = /^\/(de|ja)(?=\/|$)/.exec(pathname);
  if (!m) return { locale: 'en', path: pathname || '/' };
  return { locale: m[1] as Locale, path: pathname.slice(m[0].length) || '/' };
}

/** URL prefix of a language ('' for English). */
export const localePrefix = (locale: Locale) => (locale === 'en' ? '' : `/${locale}`);

/** "/skills" in another language ("/de/skills"); keeps a query or hash. */
export function localizedPath(path: string, locale: Locale): string {
  const prefix = localePrefix(locale);
  if (!prefix) return path;
  return path === '/' ? prefix : path.startsWith('/?') || path.startsWith('/#') ? prefix + path.slice(1) : prefix + path;
}

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

/** Language of the first render (prerendered HTML and hydration), the one shown now, and the one asked for. */
let initial: Locale = 'en';
let active: Locale = 'en';
let wanted: Locale = 'en';
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Loads the language of the URL before the first render (server: per page; browser: before hydrating). */
export async function prepareLocale(locale: Locale): Promise<void> {
  await loadPack(locale);
  initial = active = wanted = locale;
}

/** Set by the router: moves the current page to another language's URL. */
type LocaleNavigation = (locale: Locale, replace: boolean) => void;
let navigateToLocale: LocaleNavigation | null = null;
export function registerLocaleNavigation(fn: LocaleNavigation) {
  navigateToLocale = fn;
  return () => {
    if (navigateToLocale === fn) navigateToLocale = null;
  };
}

/** Switches the visible language; `fade` cross-fades it (a click), `navigate` also changes the URL. */
function show(locale: Locale, { fade, navigate, replace = false }: { fade: boolean; navigate: boolean; replace?: boolean }) {
  const swap = () => {
    if (navigate) navigateToLocale?.(locale, replace);
    active = locale;
    document.documentElement.lang = locale;
    notify();
  };
  if (fade) withViewTransition(() => flushSync(swap));
  else flushSync(swap);
}

function activate(locale: Locale, opts: { fade: boolean; navigate: boolean; replace?: boolean }) {
  wanted = locale;
  loadPack(locale).then(
    () => {
      if (wanted === locale) show(locale, opts);
    },
    () => {
      /* offline or blocked chunk: stay in the current language */
      wanted = active;
    },
  );
}

/** The visitor picked a language: remembered, and the page moves to that language's URL. */
export function setLocale(next: Locale) {
  try {
    if (next === 'en') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode: applies to this visit only */
  }
  if (next === wanted && next === active) return;
  activate(next, { fade: true, navigate: true });
}

/** The URL changed language (back/forward, a link): show that language. */
export function followUrlLocale(locale: Locale) {
  if (locale !== wanted) activate(locale, { fade: true, navigate: false });
}

/** After the first render: an English URL opened by a visitor who chose another language before. */
export function restoreSavedLocale() {
  if (initial !== 'en') return;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
  if (isLocale(saved) && saved !== 'en' && wanted === 'en') activate(saved, { fade: false, navigate: true, replace: true });
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

/** Current interface language (while prerendering and hydrating: the language of the URL). */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, () => active, () => initial);
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

/** Non-React callers. */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return translate(active, key, vars);
}

/** The current language, for code outside React (e.g. building a URL). */
export const currentLocale = () => active;

/** BCP 47 tag for Intl formatting. */
export const intlLocale: Record<Locale, string> = { en: 'en-GB', de: 'de-AT', ja: 'ja-JP' };
