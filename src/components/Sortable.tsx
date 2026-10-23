// Drag and drop ordering in edit mode. Visitors get the children unchanged (same markup as
// prerendered); in edit mode every item gets a ⠿ handle: drag it (mouse, pen or touch) and the
// list reorders live; release to keep the new order. Arrow keys on the handle move it by one.
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { useEdit } from '../lib/edit';

type Props = {
  ids: string[];
  /** Called with the new order after a drop (or an arrow-key move). */
  onReorder: (next: string[]) => void;
  renderItem: (id: string) => ReactNode;
  label: (id: string) => string;
  className?: string;
  /** Rendered after the items, not sortable (e.g. an "add" tile). */
  after?: ReactNode;
};

function moveTo(list: string[], id: string, index: number): string[] {
  const next = list.filter((x) => x !== id);
  next.splice(index, 0, id);
  return next;
}

export function SortableList({ ids, onReorder, renderItem, label, className = '', after }: Props) {
  const editing = Boolean(useEdit());
  const [preview, setPreview] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // Latest values for the window listeners of a running drag.
  const live = useRef({ ids, preview: null as string[] | null, onReorder });
  live.current.ids = ids;
  live.current.onReorder = onReorder;
  const order = preview ?? ids;

  if (!editing)
    return (
      <div className={className}>
        {ids.map((id) => renderItem(id))}
        {after}
      </div>
    );

  const show = (next: string[] | null) => {
    live.current.preview = next;
    setPreview(next);
  };

  // While dragging, the DOM order stays as it is and only the CSS `order` shows the new position:
  // moving the dragged element in the DOM would make the browser cancel a touch drag.
  const onPointerDown = (id: string) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(id);
    show(live.current.ids);
    let x = e.clientX;
    let y = e.clientY;
    const hitTest = () => {
      const current = live.current.preview;
      if (!current) return;
      const over = document
        .elementsFromPoint(x, y)
        .map((el) => el.closest<HTMLElement>('[data-sort-id]'))
        .find((el) => el && root.current?.contains(el) && el.dataset.sortId !== id);
      const target = over?.dataset.sortId;
      if (!target) return;
      const next = moveTo(current, id, current.indexOf(target));
      if (next.join() !== current.join()) show(next);
    };
    const move = (ev: globalThis.PointerEvent) => {
      x = ev.clientX;
      y = ev.clientY;
      hitTest();
    };
    // Held near the top or bottom edge, the page keeps scrolling (cards on phones are taller than the screen).
    let frame = 0;
    const scroll = () => {
      const edge = 80;
      const speed = y < edge ? -(edge - y) / 4 : y > window.innerHeight - edge ? (y - (window.innerHeight - edge)) / 4 : 0;
      if (speed) {
        window.scrollBy(0, speed);
        hitTest();
      }
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    const end = (commit: boolean) => () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', esc);
      const { preview: next, ids: before, onReorder: save } = live.current;
      if (commit && next && next.join() !== before.join()) save(next);
      show(null);
      setDragging(null);
    };
    const up = end(true);
    const cancel = end(false);
    const esc = (ev: globalThis.KeyboardEvent) => ev.key === 'Escape' && cancel();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', esc);
  };

  const onKeyDown = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = ids.indexOf(id);
    if (i + dir < 0 || i + dir >= ids.length) return;
    onReorder(moveTo(ids, id, i + dir));
  };

  return (
    <div ref={root} className={className}>
      {ids.map((id) => (
        <div
          key={id}
          data-sort-id={id}
          style={{ order: order.indexOf(id) - ids.length }}
          className={`relative flex flex-col [&>*]:flex-1 ${dragging === id ? 'z-30 rounded-lg opacity-80 outline-dashed outline-2 outline-offset-4 outline-accent' : ''}`}
        >
          {renderItem(id)}
          <button
            type="button"
            onPointerDown={onPointerDown(id)}
            onKeyDown={onKeyDown(id)}
            className={`absolute left-2 top-2 z-20 flex h-8 w-8 touch-none select-none items-center justify-center rounded-full border border-line bg-surface text-sm text-fg shadow-warm transition-colors hover:border-accent hover:text-accent ${
              dragging === id ? 'cursor-grabbing border-accent text-accent' : 'cursor-grab'
            }`}
            aria-label={`Reorder ${label(id)}: drag, or use the arrow keys`}
            title="Drag to reorder"
          >
            <span aria-hidden="true">⠿</span>
          </button>
        </div>
      ))}
      {after}
    </div>
  );
}
