import { cn } from '@/lib/utils';
import { PreviewSurface } from '@/components/site/PreviewSurface';

export type Device = 'desktop' | 'tablet' | 'mobile';

export const DEVICE_SIZES: Record<Device, { width: number | 'fill'; label: string; note: string }> = {
  desktop: { width: 'fill', label: 'Desktop', note: '1280px+' },
  tablet: { width: 834, label: 'Tablet', note: '834px' },
  mobile: { width: 390, label: 'Mobile', note: '390px' },
};

/**
 * Device preview.
 *
 * The site is rendered into a real iframe so CSS media queries resolve against
 * the device width — what you see for “Mobile” is genuinely the 390px layout,
 * not a squeezed desktop one.
 *
 * React portals keep event handling (click-to-select, inline editing) working
 * across the frame boundary; stylesheets and font variables are mirrored from
 * the parent document once the frame is ready.
 */
export function PreviewFrame({
  device,
  children,
  className,
  onBackgroundClick,
}: {
  device: Device;
  children: React.ReactNode;
  className?: string;
  onBackgroundClick?: () => void;
}) {
  const size = DEVICE_SIZES[device];

  const inner = (
    <PreviewSurface
      title={`${size.label} preview`}
      className={className}
      syncKey={device}
    >
      {children}
    </PreviewSurface>
  );

  if (device === 'desktop') {
    return (
      <div className="flex h-full w-full flex-col" onClick={onBackgroundClick}>
        <div className="browser-frame flex h-full flex-col overflow-hidden rounded-xl">
          <div className="browser-chrome shrink-0">
            <span className="browser-dot" />
            <span className="browser-dot" />
            <span className="browser-dot" />
            <span className="ml-2 truncate rounded-md bg-white/80 px-2 py-0.5 text-[0.68rem] font-medium text-[#8b8f99]">
              Editing · desktop preview
            </span>
          </div>
          <div className="min-h-0 flex-1">{inner}</div>
        </div>
      </div>
    );
  }

  if (device === 'tablet') {
    return (
      <div className="flex h-full items-center justify-center" onClick={onBackgroundClick}>
        <div className="tablet-frame h-[calc(100%-2rem)]" style={{ width: 834 + 24 }}>
          <div className="h-full overflow-hidden rounded-[16px] bg-white">
            <div style={{ width: 834, height: '100%' }}>{inner}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center" onClick={onBackgroundClick}>
      <div className="device-frame h-[calc(100%-1rem)]" style={{ width: 390 + 20 }}>
        <div className="device-frame-inner h-full">
          <div className="mx-auto mb-1 mt-1 h-1.5 w-16 rounded-full bg-black/10" />
          <div className="h-[calc(100%-10px)]" style={{ width: 390 }}>
            {inner}
          </div>
        </div>
      </div>
    </div>
  );
}
