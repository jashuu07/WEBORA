'use client';

import { cn } from '@/lib/utils';
import { prefersReducedMotion } from './studio-motion';

/**
 * The "website being assembled" moment.
 *
 * Five translucent slabs settle into the frame in sequence while a single scan
 * line travels down the page — enough to read as construction, short enough
 * (about 1.7s) that nobody waits for it. Visitors who prefer reduced motion see
 * the finished page immediately.
 */
export function AssembleOverlay({
  running,
  caption,
  slabs = 5,
}: {
  running: boolean;
  caption?: string;
  slabs?: number;
}) {
  if (!running || prefersReducedMotion()) return null;

  return (
    <div className="assemble" data-run={running ? 'true' : 'false'} aria-hidden>
      {Array.from({ length: slabs }).map((_, index) => (
        <span
          key={index}
          className="assemble-slab"
          style={{
            ['--i' as string]: index,
            ['--h' as string]: `${100 / slabs}%`,
            top: `${(index * 100) / slabs}%`,
          }}
        />
      ))}
      <span className="assemble-scan" />
      <span className="light-point" style={{ left: '18%', top: '24%' }} />
      <span className="light-point" style={{ left: '72%', top: '58%', animationDelay: '1.4s' }} />

      {caption ? (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(16,17,20,.86)] px-3 py-1.5 text-[0.7rem] font-medium text-white shadow-[0_14px_30px_-18px_rgba(16,17,20,.7)] backdrop-blur">
          {caption}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Description → AI → Website.
 *
 * The brief's generation visualisation: two quiet nodes and a moving light
 * point, not a particle system. `active` advances the emphasis so it reads as
 * progress rather than decoration.
 */
export function GenerationFlow({
  active = 0,
  captions,
  orientation = 'row',
  className,
}: {
  active?: number;
  captions?: string[];
  orientation?: 'row' | 'column';
  className?: string;
}) {
  const nodes = [
    { label: 'Business description', icon: '✎' },
    { label: 'AI processing', icon: '✦' },
    { label: 'Website generated', icon: '✓' },
  ];

  if (orientation === 'column') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {nodes.map((node, index) => (
          <div key={node.label} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[0.6rem] text-[var(--accent)]">
              {node.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-[0.78rem] font-medium', index === active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>
                {node.label}
              </span>
              {captions?.[index] && index === active ? (
                <span className="mt-0.5 block text-[0.72rem] text-[var(--text-muted)]">{captions[index]}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[0.62rem] text-[var(--accent)]">
        ✎
      </span>
      <span className="flex-1">
        <span className="flex items-center justify-between">
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Describe
          </span>
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            AI
          </span>
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Live
          </span>
        </span>
        <span className="flow-line mt-1.5 block">
          <span className="flow-dot" />
        </span>
      </span>
    </div>
  );
}
