'use client';

import { useEffect } from 'react';

/**
 * First-party page-view tracking for published sites.
 * Records one event per page view — no cookies, no third-party scripts.
 */
export function SiteViewTracker({ slug, path }: { slug: string; path: string }) {
  useEffect(() => {
    const payload = {
      path,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    };
    const timer = setTimeout(() => {
      void fetch(`/api/public/${slug}/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    }, 700);
    return () => clearTimeout(timer);
  }, [slug, path]);

  return null;
}
