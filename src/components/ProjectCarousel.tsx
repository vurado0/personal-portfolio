// A 3D ring of project screenshots that turns while the page scrolls past it (the stage stays
// pinned), bringing one project after another to the front. Only one CSS variable (--spin) is
// written per frame; the cards' positions and depth shading are CSS (transforms + cos()), so the
// GPU composites it. With reduced motion it is a plain horizontal row.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useT } from '../i18n';
import type { ProjectDoc } from '../types/content';
import { StatusBadge } from './Cards';

export function ProjectCarousel({ projects }: { projects: ProjectDoc[] }) {
  const t = useT();
  const section = useRef<HTMLElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const items = projects.filter((p) => p.cover);
  const n = items.length;
  const step = 360 / n;

  useEffect(() => {
    const el = section.current;
    const r = ring.current;
    if (!el || !r || n < 3) return;
    let frame = 0;
    let shown = -1;
    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -box.top / travel)) : 0;
      // One turn brings every project to the front once; within each step the motion eases in
      // and out, so each project rests in front for a moment (like a detent).
      const position = progress * (n - 1);
      const k = Math.floor(position);
      const f = position - k;
      const spin = (k + f * f * (3 - 2 * f)) * step;
      r.style.setProperty('--spin', spin.toFixed(2));
      const index = Math.round(spin / step) % n;
      if (index !== shown) setFront((shown = index));
    };
    const onScroll = () => (frame ||= requestAnimationFrame(update));
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [n, step]);

  /** Keyboard users: focusing a card scrolls the ring so that card is in front. */
  const bringToFront = (i: number) => {
    const el = section.current;
    if (!el || n < 2) return;
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (travel * i) / (n - 1), behavior: 'smooth' });
  };

  if (n < 3) return null;
  const current = items[front];
  return (
    <section ref={section} className="carousel" style={{ '--n': n } as CSSProperties} aria-label={t('carousel.label')}>
      <div className="carousel-stage">
        <div ref={ring} className="carousel-ring" style={{ '--spin': 0 } as CSSProperties}>
          {items.map((p, i) => (
            <Link
              key={p.slug}
              to={p.url}
              className="carousel-card"
              style={{ '--i': i } as CSSProperties}
              aria-label={p.title}
              aria-current={i === front ? 'true' : undefined}
              onFocus={() => bringToFront(i)}
            >
              <img src={p.cover} alt="" width={800} height={500} decoding="async" />
            </Link>
          ))}
        </div>
        <div className="carousel-caption material-thin" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={current.status} />
            <span className="font-mono text-xs text-muted">
              {front + 1} / {n}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold leading-snug tracking-tight">{current.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{current.summary}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link to={current.url} className="btn-primary min-h-9 px-4 text-sm">
              {t('carousel.open')}
            </Link>
            <span className="carousel-hint font-mono text-[11px] text-muted" aria-hidden="true">
              {t('carousel.hint')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
