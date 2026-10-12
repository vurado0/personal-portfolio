// Terminal-style "decode" for a whole page: every text briefly shows random glyphs and resolves
// left to right, top to bottom. The real text is always what React rendered (prerendering, screen
// readers, search engines); the effect only rewrites existing text nodes for a moment and hands
// each one back as soon as React changes it.
import { useEffect, type RefObject } from 'react';

const GLYPHS = '#$%&/<>*+=?01_-';
const DURATION = 600; // ms for one text to settle
const STEP = 22; // ms between the start of consecutive texts
const MAX_DELAY = 650; // the last texts start at the latest after this
const FRAME = 40; // ms between scramble updates

function scramble(text: string, settled: number): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    out += i < settled || /\s/.test(c) ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

type Item = { node: Text; final: string; delay: number; shown: string; done: boolean };

/** Plays the decode effect once on all text inside `ref`'s page (the closest `.page-enter`). */
export function usePageDecode(ref: RefObject<HTMLElement | null>, play: boolean) {
  useEffect(() => {
    const anchor = ref.current;
    if (!play || !anchor || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const root = anchor.closest('.page-enter') ?? anchor;
    const items: Item[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue?.trim() && !n.parentElement?.closest('script, style, svg') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const node = n as Text;
      items.push({ node, final: node.nodeValue!, delay: Math.min(items.length * STEP, MAX_DELAY), shown: node.nodeValue!, done: false });
    }
    if (!items.length) return;

    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (now - last >= FRAME) {
        last = now;
        let active = 0;
        for (const it of items) {
          if (it.done) continue;
          // React changed this text meanwhile (language switch, new results): it wins.
          if (it.node.nodeValue !== it.shown) {
            it.done = true;
            continue;
          }
          const progress = (now - start - it.delay) / DURATION;
          const next = progress >= 1 ? it.final : scramble(it.final, Math.max(0, Math.floor(it.final.length * progress)));
          it.node.nodeValue = it.shown = next;
          if (progress >= 1) it.done = true;
          else active++;
        }
        if (!active) return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      for (const it of items) if (!it.done && it.node.nodeValue === it.shown) it.node.nodeValue = it.final;
    };
    // Runs once per page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);
}

/** True the first time this page is opened in a visit (session). */
export function firstVisit(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
}
