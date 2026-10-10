import { useRef, useState } from 'react';
import { cldSrcSet, cldUrl } from '../../lib/cloudinary';
import type { PostImage } from '../../lib/feed';

export function ImageCarousel({ images, sizes = '(min-width: 768px) 640px, 100vw' }: { images: PostImage[]; sizes?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  if (!images.length) return null;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };
  const ratio = Math.min(1.25, Math.max(0.6, images[0].height / images[0].width || 1));

  return (
    <div className="group relative" aria-roledescription="carousel" aria-label={`${images.length} photo${images.length > 1 ? 's' : ''}`}>
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ aspectRatio: `1 / ${ratio}` }}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {images.map((img, i) => (
          <figure key={img.publicId || img.url} className="h-full w-full flex-none snap-center bg-latte/30" aria-roledescription="slide" aria-label={`${i + 1} of ${images.length}`}>
            <img
              src={cldUrl(img.url, 960)}
              srcSet={cldSrcSet(img.url)}
              sizes={sizes}
              alt={img.alt}
              width={img.width}
              height={img.height}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </figure>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous photo" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-foam/85 text-ink shadow-warm disabled:opacity-0 sm:flex">
            ‹
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index === images.length - 1} aria-label="Next photo" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-foam/85 text-ink shadow-warm disabled:opacity-0 sm:flex">
            ›
          </button>
          <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-accent' : 'w-1.5 bg-line'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
