'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Monitor,
  PanelsLeftBottom,
  Redo2,
  Rocket,
  Sliders,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import type { Website } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { DEVICE_SIZES, type Device } from './PreviewFrame';

export function EditorTopbar({
  website,
  device,
  onDevice,
  saveState,
  lastSavedAt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPublish,
  publishing,
  onToggleLeft,
  onToggleRight,
  leftOpen,
  rightOpen,
}: {
  website: Website;
  device: Device;
  onDevice: (device: Device) => void;
  saveState: 'saved' | 'saving' | 'dirty' | 'error';
  lastSavedAt?: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPublish: () => void;
  publishing: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  leftOpen: boolean;
  rightOpen: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState(`/s/${website.slug}`);

  useEffect(() => {
    setPreviewUrl(`/s/${website.slug}`);
  }, [website.slug]);

  const devices: { id: Device; icon: typeof Monitor }[] = [
    { id: 'desktop', icon: Monitor },
    { id: 'tablet', icon: Tablet },
    { id: 'mobile', icon: Smartphone },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--line)] bg-white px-3 sm:px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-[var(--text-muted)] transition hover:text-[var(--text)]"
        title="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="flex min-w-0 items-center gap-2.5">
        <div className="min-w-0">
          <p className="truncate text-[0.88rem] font-semibold leading-tight">{website.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <StatusChip status={website.status} />
            <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
          </div>
        </div>
      </div>

      <div className="mx-auto hidden items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 md:flex">
        {devices.map((item) => {
          const Icon = item.icon;
          const active = device === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onDevice(item.id)}
              aria-pressed={active}
              title={`${DEVICE_SIZES[item.id].label} · ${DEVICE_SIZES[item.id].note}`}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.8rem] font-medium transition-all',
                active ? 'bg-white text-[var(--text)] shadow-[var(--shadow-xs)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{DEVICE_SIZES[item.id].label}</span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center gap-1 rounded-lg border border-[var(--line)] p-0.5 sm:flex">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            className="rounded-md p-1.5 text-[var(--text-muted)] transition hover:bg-[#f4f2ee] disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            className="rounded-md p-1.5 text-[var(--text-muted)] transition hover:bg-[#f4f2ee] disabled:opacity-40"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleLeft}
          aria-pressed={leftOpen}
          title="Toggle sections panel"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] text-[var(--text-muted)] transition hover:text-[var(--text)] xl:hidden"
        >
          <PanelsLeftBottom className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleRight}
          aria-pressed={rightOpen}
          title="Toggle element settings"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] text-[var(--text-muted)] transition hover:text-[var(--text)] 2xl:hidden"
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>

        <ButtonLink
          href={previewUrl}
          target="_blank"
          variant="outline"
          size="sm"
          icon={<Eye className="h-3.5 w-3.5" />}
          className="hidden sm:inline-flex"
        >
          Preview
        </ButtonLink>

        <Button
          size="sm"
          onClick={onPublish}
          loading={publishing}
          icon={<Rocket className="h-3.5 w-3.5" />}
        >
          {website.status === 'published' ? 'Update' : 'Publish'}
        </Button>
      </div>
    </header>
  );
}

function SaveIndicator({
  state,
  lastSavedAt,
}: {
  state: 'saved' | 'saving' | 'dirty' | 'error';
  lastSavedAt?: string;
}) {
  const time = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-[var(--text-muted)]">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (state === 'dirty') {
    return <span className="text-[0.72rem] font-medium text-amber-600">Unsaved changes</span>;
  }
  if (state === 'error') {
    return <span className="text-[0.72rem] font-medium text-red-600">Save failed — retrying</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-[var(--text-muted)]">
      <Check className="h-3 w-3 text-emerald-600" /> Saved {time}
    </span>
  );
}

export { ExternalLink };
