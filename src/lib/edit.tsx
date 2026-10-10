// Edit mode (owner only). This file is tiny and part of the public bundle; the actual editor
// (forms, validation, GitHub publishing) is loaded lazily from src/edit/ only for the owner.
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { ContentBundle } from '../types/content';

export type EditTarget =
  | { kind: 'profile' }
  | { kind: 'nav' }
  | { kind: 'skill'; id?: string; group?: string }
  | { kind: 'skill-groups' }
  | { kind: 'project'; slug?: string }
  | { kind: 'knowhow'; path?: string; category?: string }
  | { kind: 'article'; path?: string }
  | { kind: 'certificate'; id?: string }
  | { kind: 'hobby'; id?: string }
  | { kind: 'cv-personal' }
  | { kind: 'cv-pdf' }
  | { kind: 'cv-section'; id?: string }
  | { kind: 'cv-entry'; section: string; index?: number }
  | { kind: 'post'; id: string }
  | { kind: 'post-new' }
  | { kind: 'page'; id: string };

export type EditApi = {
  /** Live content: published state + unpublished edits. */
  bundle: ContentBundle;
  open: (target: EditTarget) => void;
  remove: (target: EditTarget, label: string) => void;
  move?: (target: EditTarget, dir: -1 | 1) => void;
  canMove: (target: EditTarget) => boolean;
};

const EditContext = createContext<EditApi | null>(null);
export const EditContextProvider = EditContext.Provider;

export function useEdit(): EditApi | null {
  return useContext(EditContext);
}

// ---- Edit-mode switch ----------------------------------------------------------
// Everyone (the owner too) first sees the visitor version. The owner turns edit mode on with the
// "✎ Edit" button; it lasts for the browser session only.

const EDIT_KEY = 'edit-mode';
const listeners = new Set<() => void>();

function readEditMode(): boolean {
  try {
    return sessionStorage.getItem(EDIT_KEY) === '1' && localStorage.getItem('is-admin') === '1';
  } catch {
    return false;
  }
}

export function setEditMode(on: boolean) {
  try {
    if (on) sessionStorage.setItem(EDIT_KEY, '1');
    else sessionStorage.removeItem(EDIT_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function useEditModeOn(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    readEditMode,
    () => false,
  );
}

/** Loads the editor once the owner switches edit mode on, and wraps the app with it. */
export function EditRoot({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<{ children: ReactNode }> | null>(null);
  const on = useEditModeOn();
  // /admin has its own editor (and /login no content): keep a single draft owner at a time.
  const off = /^\/(admin|login)(\/|$)/.test(useLocation().pathname);
  useEffect(() => {
    if (on && !Provider) import('../edit/EditProvider').then((m) => setProvider(() => m.EditProvider));
  }, [on, Provider]);
  return Provider && on && !off ? <Provider>{children}</Provider> : <>{children}</>;
}

const toolBtn =
  'flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-sm text-fg shadow-warm transition-colors hover:border-accent hover:text-accent';

/**
 * Hover tools (✎ edit, ✕ delete, ↑↓ move) shown top-right on an element in edit mode.
 * The parent needs `relative group`. Appear after a short hover; always visible on touch screens.
 */
export function ItemTools({ target, label, className = '' }: { target: EditTarget; label: string; className?: string }) {
  const edit = useEdit();
  if (!edit) return null;
  const movable = edit.move && edit.canMove(target);
  return (
    <div
      className={`absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity delay-0 group-hover:opacity-100 group-hover:delay-300 focus-within:opacity-100 [@media(hover:none)]:opacity-100 ${className}`}
    >
      {movable ? (
        <>
          <button type="button" className={toolBtn} onClick={(e) => (e.preventDefault(), edit.move!(target, -1))} aria-label={`Move ${label} up`} title="Move up">
            ↑
          </button>
          <button type="button" className={toolBtn} onClick={(e) => (e.preventDefault(), edit.move!(target, 1))} aria-label={`Move ${label} down`} title="Move down">
            ↓
          </button>
        </>
      ) : null}
      <button type="button" className={toolBtn} onClick={(e) => (e.preventDefault(), edit.open(target))} aria-label={`Edit ${label}`} title="Edit">
        ✎
      </button>
      <button type="button" className={`${toolBtn} hover:border-red-500 hover:text-red-500`} onClick={(e) => (e.preventDefault(), edit.remove(target, label))} aria-label={`Delete ${label}`} title="Delete">
        ✕
      </button>
    </div>
  );
}

/** Dashed "+ add" tile shown only in edit mode. */
export function AddButton({ target, label, className = '' }: { target: EditTarget; label: string; className?: string }) {
  const edit = useEdit();
  if (!edit) return null;
  return (
    <button
      type="button"
      onClick={() => edit.open(target)}
      className={`flex min-h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      <span className="text-xl" aria-hidden="true">
        +
      </span>
      {label}
    </button>
  );
}

/** Small inline "✎ edit" button for page headers in edit mode. */
export function EditButton({ target, label = 'edit' }: { target: EditTarget; label?: string }) {
  const edit = useEdit();
  if (!edit) return null;
  return (
    <button type="button" onClick={() => edit.open(target)} className="chip min-h-9 border-accent text-accent">
      ✎ {label}
    </button>
  );
}
