import { useEffect, useRef, useState } from 'react';
import { LOCALES, preloadLocale, setLocale, useLocale, useT } from '../i18n';

/** Globe + language code in the header; opens a small list of the three languages. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center gap-1.5 rounded-md border border-line/70 px-2.5 font-mono text-xs font-bold text-fg transition-colors hover:border-accent"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('lang.title')} (${current.label})`}
        title={t('lang.title')}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" strokeLinejoin="round" />
        </svg>
        {current.short}
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={t('lang.button')}
          className="absolute right-0 top-full z-50 mt-2 min-w-[9.5rem] overflow-hidden rounded-md border border-line bg-bg py-1 font-mono text-sm shadow-warm"
        >
          {LOCALES.map((l) => (
            <li key={l.id} role="option" aria-selected={l.id === locale} lang={l.id}>
              <button
                type="button"
                onPointerEnter={() => preloadLocale(l.id)}
                onFocus={() => preloadLocale(l.id)}
                onClick={() => {
                  setLocale(l.id);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left hover:bg-line/30 ${l.id === locale ? 'text-accent' : 'text-fg'}`}
              >
                <span>{l.label}</span>
                <span className="text-xs text-muted">{l.id === locale ? '✓' : l.short}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
