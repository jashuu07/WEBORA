'use client';

import type { Website } from '@/types';
import { SiteRenderer } from '@/components/site/SiteRenderer';
import { cn } from '@/lib/utils';

/**
 * A browser window showing a *real* generated website.
 *
 * The site inside is the genuine `SiteRenderer` output for that website — the
 * same components that ship to visitors — scaled to fit the frame. The frame
 * adds the physicality: layered shadow, a whisper of sheen and an optional
 * reflection on the floor.
 *
 * Widths are passed in (not fixed in CSS) so a caller can lay out a scene at
 * any size; the scale is derived from a 1180px design width, which keeps the
 * rendered layout identical to the real desktop breakpoint.
 */

export const RENDER_WIDTH = 1180;
const CHROME_HEIGHT = 38;

export function BrowserWindow({
  website,
  width,
  contentHeight,
  label,
  address,
  variant = 'primary',
  masked = false,
  className,
}: {
  website: Website;
  /** Frame width in px — the inner site is scaled to match. */
  width: number;
  /** Height of the page area (excluding the chrome bar). */
  contentHeight: number;
  label?: string;
  address?: string;
  variant?: 'primary' | 'back';
  /** Fade the bottom edge, so the page reads as continuing below the frame. */
  masked?: boolean;
  className?: string;
}) {
  const page = website.pages.find((p) => p.slug === 'home') ?? website.pages[0];
  if (!page) return null;

  const scale = width / RENDER_WIDTH;
  const innerHeight = Math.ceil(contentHeight / scale);

  return (
    <div
      className={cn('window-3d', variant === 'primary' && 'window-3d--elevated', className)}
      style={{ width, height: contentHeight + CHROME_HEIGHT }}
    >
      <div className="browser-chrome">
        <span className="browser-dot" />
        <span className="browser-dot" />
        <span className="browser-dot" />
        <span className="ml-2 truncate rounded-md bg-white/80 px-2 py-0.5 text-[0.62rem] font-medium text-[#8b8f99]">
          {address ?? `${website.slug}.webora.app`}
        </span>
        {label ? (
          <span className="ml-auto hidden rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-[#a5430a] sm:inline">
            {label}
          </span>
        ) : null}
      </div>

      <div className="relative overflow-hidden bg-white" style={{ height: contentHeight }}>
        <div
          aria-hidden
          className="pointer-events-none origin-top-left"
          style={{ width: RENDER_WIDTH, height: innerHeight, transform: `scale(${scale})` }}
        >
          <SiteRenderer website={website} page={page} />
        </div>

        {masked ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/70 to-transparent" />
        ) : null}

        {variant === 'primary' ? <span className="window-sheen" aria-hidden /> : null}
      </div>
    </div>
  );
}
