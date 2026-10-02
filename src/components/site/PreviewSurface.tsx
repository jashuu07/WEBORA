'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * A real iframe that mirrors the app's stylesheets and hosts the site renderer
 * through a React portal.
 *
 * Why an iframe rather than a scaled div: media queries resolve against the
 * frame's own viewport, so a "Mobile" preview is genuinely the 390px layout
 * instead of a squeezed desktop one. The portal keeps click-to-select and
 * inline editing working across the frame boundary.
 *
 * Shared by the editor's device frames and the /create studio.
 */
export function PreviewSurface({
  title,
  children,
  className,
  syncKey,
  onBackgroundClick,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Change this (e.g. the device name) to re-sync mirrored styles. */
  syncKey?: string;
  onBackgroundClick?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sync = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const head = doc.head;

      // Mirror the app's stylesheets (Next injects link/style tags).
      const existing = Array.from(head.querySelectorAll('[data-webora-style]'));
      const sources = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style'),
      ) as (HTMLLinkElement | HTMLStyleElement)[];

      if (existing.length !== sources.length) {
        existing.forEach((node) => node.remove());
        sources.forEach((node) => {
          const clone = node.cloneNode(true) as HTMLElement;
          clone.setAttribute('data-webora-style', 'true');
          head.appendChild(clone);
        });
      }

      // Font + theme classes live on <html> in the parent document.
      doc.documentElement.className = document.documentElement.className;
      doc.documentElement.style.background = '#ffffff';
      doc.body.style.margin = '0';
      doc.body.style.background = '#ffffff';

      if (!head.querySelector('base')) {
        const base = doc.createElement('base');
        base.target = '_blank';
        head.appendChild(base);
      }

      setReady(true);
    };

    sync();
    const timer = setTimeout(sync, 260);
    return () => clearTimeout(timer);
  }, [syncKey]);

  return (
    <div className={cn('relative bg-white', className)} onClick={onBackgroundClick}>
      <iframe
        ref={iframeRef}
        title={title}
        className="h-full w-full border-0 bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
      />
      {ready && iframeRef.current?.contentDocument ? createPortal(children, iframeRef.current.contentDocument.body) : null}
    </div>
  );
}
