import type { CSSProperties, ReactNode } from 'react';
import backgrounds from '../generated/backgrounds.json';

export type BackgroundName = keyof typeof backgrounds;

/**
 * Coffee texture background. The tiny blurred placeholder sits underneath the real WebP,
 * so something warm shows instantly. Content always sits on an overlay for readability.
 */
export function Background({
  name,
  className = '',
  overlay = true,
  position = 'center',
  children,
}: {
  name: BackgroundName;
  className?: string;
  overlay?: boolean;
  position?: string;
  children?: ReactNode;
}) {
  const bg = backgrounds[name];
  const style: CSSProperties = {
    backgroundImage: `url(${bg.src}), url(${bg.placeholder})`,
    backgroundSize: 'cover, cover',
    backgroundPosition: `${position}, ${position}`,
  };
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {overlay ? <div className="bg-overlay absolute inset-0" aria-hidden="true" /> : null}
      <div className="relative">{children}</div>
    </div>
  );
}
