// Opens the site search with ⌘K / Ctrl+K or "/" (outside text fields) and from the header. The search
// itself (SearchDialog) is a separate chunk, downloaded on hover/focus of the button or when opened.
import { lazy, Suspense, useEffect, useState } from 'react';
import { useT } from '../i18n';

const loadDialog = () => import('./SearchDialog');
const SearchDialog = lazy(loadDialog);
export const preloadSearch = () => void loadDialog().catch(() => {});

let setOpenGlobal: ((open: boolean) => void) | null = null;
export const openSearch = () => setOpenGlobal?.(true);

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** Keyboard shortcuts and the dialog; rendered once in the layout. */
export function SearchRoot() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpenGlobal = setOpen;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target) && !document.querySelector('dialog[open]')) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      setOpenGlobal = null;
    };
  }, []);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <SearchDialog onClose={() => setOpen(false)} />
    </Suspense>
  );
}

const Magnifier = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" strokeLinecap="round" />
  </svg>
);

/** Header button; shows the shortcut of the visitor's platform once mounted (⌘K on Apple, Ctrl K elsewhere). */
export function SearchButton({ className = '' }: { className?: string }) {
  const t = useT();
  const [shortcut, setShortcut] = useState('⌘K');
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setShortcut('Ctrl K');
  }, []);
  return (
    <button
      type="button"
      onClick={openSearch}
      onPointerEnter={preloadSearch}
      onFocus={preloadSearch}
      aria-label={t('search.open')}
      aria-keyshortcuts="Meta+K Control+K /"
      title={`${t('search.open')} (${shortcut})`}
      className={`hidden h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-line/70 px-2.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-fg sm:inline-flex ${className}`}
    >
      <Magnifier />
      <kbd className="hidden font-mono lg:inline xl:hidden 2xl:inline" aria-hidden="true">
        {shortcut}
      </kbd>
    </button>
  );
}

/** Row in the mobile menu (phones have no room for the header button). */
export function SearchMenuItem({ onOpen }: { onOpen: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        onOpen();
        openSearch();
      }}
      onFocus={preloadSearch}
      className="col-span-full mb-1 flex min-h-11 items-center gap-2 rounded-md border border-line/70 px-2.5 text-left text-sm text-muted hover:border-accent hover:text-fg sm:hidden"
    >
      <Magnifier />
      {t('search.title')}
    </button>
  );
}
