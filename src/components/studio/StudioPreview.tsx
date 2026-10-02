'use client';

import { PreviewSurface } from '@/components/site/PreviewSurface';
import { SiteRenderer } from '@/components/site/SiteRenderer';
import { AssembleOverlay } from './GenerationFlow';
import { DEVICE_LABELS, type Device } from './DeviceSwitch';
import { useElementWidth } from './studio-motion';
import { cn } from '@/lib/utils';
import type { Website } from '@/types';

/**
 * The centrepiece of the /create workspace: the live website in a 3D frame.
 *
 * It is a real iframe, so switching device genuinely re-lays-out the page
 * against 834px or 390px — and the frame around it animates between the three
 * sizes rather than snapping, which is what makes the change legible.
 */
export function StudioPreview({
  website,
  device,
  assembling,
  caption,
  flashIds,
  status,
  className,
}: {
  website: Website;
  device: Device;
  assembling?: boolean;
  caption?: string;
  flashIds?: string[];
  status?: React.ReactNode;
  className?: string;
}) {
  const [areaRef, areaWidth] = useElementWidth<HTMLDivElement>();
  const page = website.pages.find((p) => p.slug === 'home') ?? website.pages[0];

  const pad = 44;
  const natural = device === 'desktop' ? Math.max(320, areaWidth - pad) : device === 'tablet' ? 834 + 24 : 390 + 20;
  const scale = areaWidth > 0 ? Math.min(1, (areaWidth - 8) / natural) : 1;

  return (
    <div ref={areaRef} className={cn('relative', className)}>
      <div className="studio h-full" style={{ perspective: 1900 }}>
        <div
          className="flex h-full justify-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            transition: 'transform 420ms var(--ease)',
          }}
        >
          <div
            className="window-3d window-3d--elevated flex shrink-0 flex-col"
            style={{
              width: natural,
              height: '100%',
              transform: 'rotateX(1.1deg)',
              transformStyle: 'preserve-3d',
              transition: 'width 440ms var(--ease), height 440ms var(--ease), border-radius 440ms var(--ease)',
              borderRadius: device === 'mobile' ? 26 : device === 'tablet' ? 20 : 16,
            }}
          >
            <div className="browser-chrome shrink-0">
              <span className="browser-dot" />
              <span className="browser-dot" />
              <span className="browser-dot" />
              <span className="ml-2 truncate rounded-md bg-white/80 px-2 py-0.5 text-[0.66rem] font-medium text-[#8b8f99]">
                {website.slug === 'live-draft' ? 'draft preview · not saved' : `${website.slug}.webora.app`}
              </span>
              <span className="ml-auto rounded-full bg-[var(--surface)] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--text-muted)]">
                {DEVICE_LABELS[device].note}
              </span>
            </div>

            <div className="relative min-h-0 flex-1">
              <PreviewSurface title={`${DEVICE_LABELS[device].label} preview`} className="h-full" syncKey={device}>
                <SiteRenderer website={website} page={page} flashIds={flashIds} />
              </PreviewSurface>

              <AssembleOverlay running={Boolean(assembling)} caption={caption} />

              {status ? <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40">{status}</div> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="studio-floor" aria-hidden />
    </div>
  );
}
