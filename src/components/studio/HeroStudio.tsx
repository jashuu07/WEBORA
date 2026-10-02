'use client';

import { useEffect, useState } from 'react';
import { Rocket, Search, Sparkles, Type } from 'lucide-react';
import type { Website } from '@/types';
import { BrowserWindow } from './BrowserWindow';
import { AssembleOverlay, GenerationFlow } from './GenerationFlow';
import { useElementWidth, useInView, useStageMotion, prefersReducedMotion } from './studio-motion';
import { cn } from '@/lib/utils';

const CAPTIONS = [
  'Reading your description',
  'Choosing a layout',
  'Writing your copy',
  'Applying the design system',
  'Checking mobile layout',
  'Website ready',
];

/**
 * The hero workspace: a large browser window showing a generated bakery site,
 * floating above the page with two layered previews behind it and a few glass
 * tool panels at different depths.
 *
 * Depth is kept deliberately small — pointer tilt ≤ 3°, shift ≤ 9px — so the
 * effect reads as physical weight rather than a spinning card. Everything is
 * CSS 3D; there is no WebGL on this page.
 */
export function HeroStudio({ sites }: { sites: Website[] }) {
  const [primary, secondary, tertiary] = sites;
  const motionRef = useStageMotion<HTMLDivElement>();
  const [widthRef, width] = useElementWidth<HTMLDivElement>();
  const [viewRef, inView] = useInView<HTMLDivElement>();

  const [assembling, setAssembling] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);

  // The assembly moment plays once, when the workspace first scrolls into view.
  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    setAssembling(true);
    const timer = setTimeout(() => setAssembling(false), 1900);
    return () => clearTimeout(timer);
  }, [inView]);

  // A quiet progress indicator: six captions, one per real pipeline stage.
  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const timer = setInterval(() => setCaptionIndex((i) => (i + 1) % CAPTIONS.length), 1900);
    return () => clearInterval(timer);
  }, [inView]);

  if (!primary) return null;

  // Composed with CSS breakpoints (hidden/lg:block below) rather than JS media
  // queries, so the layout never swaps after hydration on a phone.
  const stageW = width || 620;
  const primaryW = Math.min(stageW, 660);
  const primaryH = Math.round(primaryW * 0.62);
  const midW = Math.round(primaryW * 0.66);
  const farW = Math.round(primaryW * 0.56);
  const stageH = primaryH + 38 + 54;

  const setRefs = (node: HTMLDivElement | null) => {
    motionRef.current = node;
    widthRef.current = node;
    viewRef.current = node;
  };

  return (
    <div ref={setRefs} className="studio">
      <div className="studio-stage" style={{ height: stageH }}>
          {/* light + floor: what makes the window feel like it is floating */}
          <div
            className="pointer-events-none absolute -inset-x-10 -top-20 bottom-0 opacity-70"
            style={{ background: 'radial-gradient(60% 50% at 55% 32%, rgba(242,106,27,.16), transparent 70%)' }}
          />
          <div className="studio-floor" />

          {/* ── layered previews behind the main window ── */}
          {tertiary ? (
            <div
              className="studio-layer hidden lg:block"
              style={{ top: -46, right: -52, transform: 'translateZ(-150px) rotateY(-2.8deg)' }}
              aria-hidden
            >
              <div className="studio-follow" style={{ ['--m' as string]: 0.4, ['--pm' as string]: 2.1 }}>
                <div className="opacity-[.62] blur-[0.4px]">
                  <BrowserWindow
                    website={tertiary}
                    width={farW}
                    contentHeight={Math.round(farW * 0.62)}
                    label="Gym"
                    variant="back"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {secondary ? (
            <div
              className="studio-layer hidden md:block"
              style={{ top: -26, left: -58, transform: 'translateZ(-90px) rotateY(2.4deg)' }}
              aria-hidden
            >
              <div className="studio-follow" style={{ ['--m' as string]: 0.55, ['--pm' as string]: 1.5 }}>
                <div className="opacity-[.78]">
                  <BrowserWindow
                    website={secondary}
                    width={midW}
                    contentHeight={Math.round(midW * 0.62)}
                    label="Salon"
                    variant="back"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* ── the main window ── */}
          <div className="relative z-10 mx-auto" style={{ width: primaryW }}>
            <div className="studio-follow">
              <div className="relative">
                <BrowserWindow
                  website={primary}
                  width={primaryW}
                  contentHeight={primaryH}
                  label="Bakery"
                  masked
                />
                <div className="window-reflection" aria-hidden />
                <AssembleOverlay running={assembling} caption={CAPTIONS[captionIndex]} />
              </div>
            </div>
          </div>

          {/* ── floating tool panels, at different depths ── */}
          {/* tablets and phones: two compact panels instead of four floating ones */}
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-2 md:hidden">
            <MiniPanel icon={<Sparkles className="h-3.5 w-3.5" />} title="AI Design" note="Tokens applied" />
            <MiniPanel icon={<Rocket className="h-3.5 w-3.5" />} title="Publish" note="One click" />
          </div>

          <div className="hidden md:block">
              <FloatPanel
                className="left-[-26px] top-[-20px]"
                depth={70}
                multiplier={1.15}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                title="AI Design"
                note="Tokens applied"
              />
              <FloatPanel
                className="right-[-24px] top-[38%]"
                depth={48}
                multiplier={1.05}
                icon={<Type className="h-3.5 w-3.5" />}
                title="Content"
                note="Sections written"
                align="right"
              />
              <FloatPanel
                className="bottom-[6px] left-[6%]"
                depth={86}
                multiplier={1}
                icon={<Rocket className="h-3.5 w-3.5" />}
                title="Publish"
                note="Live in one click"
              />
              <div className="hidden 2xl:block">
                <FloatPanel
                  className="bottom-[-14px] right-[8%]"
                  depth={34}
                  multiplier={1.25}
                  icon={<Search className="h-3.5 w-3.5" />}
                  title="SEO"
                  note="Meta + sitemap ready"
                  align="right"
                />
              </div>
        </div>

      {/* description → AI → website */}
      <div className="glass relative z-10 mx-auto mt-8 w-full max-w-[290px] rounded-2xl px-4 py-3">
          <GenerationFlow active={assembling ? 1 : 2} />
        <p className="mt-2.5 text-[0.72rem] leading-relaxed text-[var(--text-muted)]">
          {assembling ? CAPTIONS[captionIndex] : 'Three real websites, generated from one-line descriptions.'}
        </p>
      </div>
      </div>
    </div>
  );
}

function FloatPanel({
  className,
  depth,
  multiplier,
  icon,
  title,
  note,
  align = 'left',
}: {
  className?: string;
  depth: number;
  multiplier: number;
  icon: React.ReactNode;
  title: string;
  note: string;
  align?: 'left' | 'right';
}) {
  return (
    <div className={cn('studio-layer z-30', className)} style={{ transform: `translateZ(${depth}px)` }}>
      <div className="studio-follow" style={{ ['--m' as string]: multiplier, ['--pm' as string]: 1 }}>
        <div className="panel-float flex items-center gap-2.5 px-3 py-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-[#a5430a]">{icon}</span>
          <span className={cn('min-w-0', align === 'right' && 'text-right')}>
            <span className="block whitespace-nowrap text-[0.76rem] font-semibold leading-tight">{title}</span>
            <span className="block whitespace-nowrap text-[0.68rem] text-[var(--text-muted)]">{note}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniPanel({ icon, title, note }: { icon: React.ReactNode; title: string; note: string }) {
  return (
    <div className="panel-float flex items-center gap-2 px-2.5 py-1.5">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-soft)] text-[#a5430a]">{icon}</span>
      <span>
        <span className="block text-[0.72rem] font-semibold leading-tight">{title}</span>
        <span className="block text-[0.64rem] text-[var(--text-muted)]">{note}</span>
      </span>
    </div>
  );
}
