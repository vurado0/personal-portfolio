import { useEffect, useRef } from 'react';

const GLYPHS = '#$%&/<>*+=?01_-';
const DURATION = 650; // ms until the last character has settled
const FRAME = 40; // ms between scramble updates (calmer than every animation frame)

function scramble(text: string, settled: number): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    out += i < settled || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

/**
 * Terminal-style "decode": the text shows random glyphs and resolves left to right.
 * The real text is always what is rendered (prerendering, screen readers, search engines); the
 * effect only rewrites the existing text node for a moment after mount, so React stays in charge.
 */
export function DecodeText({ text, play, delay = 0 }: { text: string; play: boolean; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const latest = useRef(text);
  latest.current = text;

  useEffect(() => {
    const node = ref.current?.firstChild;
    if (!play || !(node instanceof Text) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const final = latest.current;
      const progress = (now - start) / DURATION;
      if (progress >= 1) {
        node.nodeValue = final;
        return;
      }
      if (now - last >= FRAME) {
        last = now;
        node.nodeValue = scramble(final, Math.max(0, Math.floor(final.length * progress)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      node.nodeValue = latest.current;
    };
    // Plays once per mount; later text changes (e.g. language) are picked up via `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  return <span ref={ref}>{text}</span>;
}
