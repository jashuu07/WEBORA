'use client';

import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Device = 'desktop' | 'tablet' | 'mobile';

export const DEVICE_LABELS: Record<Device, { label: string; note: string }> = {
  desktop: { label: 'Desktop', note: '1280px+' },
  tablet: { label: 'Tablet', note: '834px' },
  mobile: { label: 'Mobile', note: '390px' },
};

const ICONS: Record<Device, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

/** Segmented device control. The preview morphs between sizes, not just widths. */
export function DeviceSwitch({
  device,
  onDevice,
  className,
}: {
  device: Device;
  onDevice: (next: Device) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-xl border border-[var(--line)] bg-white/80 p-0.5 backdrop-blur',
        className,
      )}
      role="group"
      aria-label="Preview size"
    >
      {(Object.keys(DEVICE_LABELS) as Device[]).map((id) => {
        const Icon = ICONS[id];
        const active = device === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onDevice(id)}
            aria-pressed={active}
            title={`${DEVICE_LABELS[id].label} · ${DEVICE_LABELS[id].note}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[0.76rem] font-medium transition-colors',
              active ? 'bg-[var(--surface-ink)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{DEVICE_LABELS[id].label}</span>
          </button>
        );
      })}
    </div>
  );
}
