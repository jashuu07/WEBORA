'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Pointer + scroll motion for the 3D studio scenes.
 *
 * Design rules encoded here, not in the components:
 *   • rotation never exceeds `tilt` degrees (default 3° — the brief's 2–4° budget)
 *   • translation never exceeds `shift` px (default 9px — the brief's 5–10px budget)
 *   • scroll drift is a fraction of `drift` px, never a scroll-jack
 *   • motion is skipped entirely when the visitor prefers reduced motion or is
 *     on a coarse pointer (touch), where a tilt would just feel laggy
 *
 * Values are written to the element as CSS custom properties, and the CSS
 * decides how much each layer moves (`--m`) and drifts (`--pm`) — so depth is a
 * stylesheet decision, not a re-render.
 */
export function useStageMotion<T extends HTMLElement = HTMLDivElement>({
  tilt = 3,
  shift = 9,
  drift = 26,
}: {
  tilt?: number;
  shift?: number;
  drift?: number;
} = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (reduced.matches || !fine.matches) return;

    const target = { rx: 0, ry: 0, tx: 0, ty: 0, par: 0 };
    const current = { ...target };
    let frame = 0;

    // Scroll anchor: measured from the element's resting position so the hero
    // starts perfectly neutral on load.
    let anchorTop = 0;
    let anchorSpan = 1;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      anchorTop = rect.top + window.scrollY;
      anchorSpan = Math.max(320, rect.height * 0.9);
    };

    const write = () => {
      node.style.setProperty('--rx', current.rx.toFixed(3));
      node.style.setProperty('--ry', current.ry.toFixed(3));
      node.style.setProperty('--tx', current.tx.toFixed(2));
      node.style.setProperty('--ty', current.ty.toFixed(2));
      node.style.setProperty('--par', current.par.toFixed(2));
    };

    const tick = () => {
      const settled =
        Math.abs(target.rx - current.rx) < 0.004 &&
        Math.abs(target.ry - current.ry) < 0.004 &&
        Math.abs(target.tx - current.tx) < 0.05 &&
        Math.abs(target.ty - current.ty) < 0.05 &&
        Math.abs(target.par - current.par) < 0.05;

      if (settled) {
        Object.assign(current, target);
        write();
        frame = 0;
        return;
      }

      current.rx += (target.rx - current.rx) * 0.16;
      current.ry += (target.ry - current.ry) * 0.16;
      current.tx += (target.tx - current.tx) * 0.16;
      current.ty += (target.ty - current.ty) * 0.16;
      current.par += (target.par - current.par) * 0.12;
      write();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1; // -1 … 1
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      const cx = Math.max(-1, Math.min(1, nx));
      const cy = Math.max(-1, Math.min(1, ny));
      target.ry = cx * tilt;
      target.rx = -cy * tilt * 0.75;
      target.tx = cx * shift;
      target.ty = cy * shift * 0.6;
      node.dataset.tracking = 'true';
      start();
    };

    const onPointerLeave = () => {
      target.rx = 0;
      target.ry = 0;
      target.tx = 0;
      target.ty = 0;
      node.dataset.tracking = 'false';
      start();
    };

    const onScroll = () => {
      const progress = Math.max(0, Math.min(1, (window.scrollY - anchorTop + anchorSpan * 0.35) / anchorSpan));
      target.par = -drift * progress;
      start();
    };

    measure();
    write();

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);

    const onChange = () => {
      if (reduced.matches || !fine.matches) {
        onPointerLeave();
        target.par = 0;
        start();
      }
    };
    reduced.addEventListener('change', onChange);
    fine.addEventListener('change', onChange);

    return () => {
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      reduced.removeEventListener('change', onChange);
      fine.removeEventListener('change', onChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tilt, shift, drift]);

  return ref;
}

/** Measured width of an element — used to keep preview layers proportional. */
export function useElementWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const apply = () => setWidth(node.clientWidth);
    apply();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', apply);
      return () => window.removeEventListener('resize', apply);
    }
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/** True while the element is in (or near) the viewport — pauses idle loops. */
export function useInView<T extends HTMLElement = HTMLDivElement>({ rootMargin = '160px' } = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}

/** Live media query — used to keep the mobile composition genuinely simpler. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = () => setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Paces a staged reveal: advances one step every `minimumMs` while a request is
 * in flight, and stops on the last step. The measured durations shown to the
 * owner afterwards come from the server, not from this timer.
 */
export function useStagePacer(count: number, running: boolean, minimumMs = 320) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (activeIndex >= count - 1) return;
    const timer = setTimeout(() => setActiveIndex((i) => Math.min(i + 1, count - 1)), minimumMs);
    return () => clearTimeout(timer);
  }, [activeIndex, count, running, minimumMs]);

  return [activeIndex, setActiveIndex] as const;
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
