import type { ReactNode } from 'react';
import backgrounds from '../generated/backgrounds.json';

export type BackgroundName = keyof typeof backgrounds;

/**
 * A section on thin frosted material. The coffee texture itself is now the site-wide wallpaper
 * (GlassNav), so `name` and `position` only remain for the call sites.
 */
export function Background({
  className = '',
  page = false,
  children,
}: {
  name: BackgroundName;
  className?: string;
  overlay?: boolean;
  position?: string;
  /** A page header: inside the page container, with room below. */
  page?: boolean;
  children?: ReactNode;
}) {
  const pane = (
    <div className={`material-thin overflow-hidden rounded-[28px] ${page ? 'pb-6' : ''} ${className}`}>
      <div className="relative">{children}</div>
    </div>
  );
  return page ? <div className="container-page pt-6">{pane}</div> : pane;
}
