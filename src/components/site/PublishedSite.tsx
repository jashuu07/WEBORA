import Link from 'next/link';
import type { Website } from '@/types';
import { SiteRenderer } from '@/components/site/SiteRenderer';
import { SiteViewTracker } from '@/components/site/SiteViewTracker';
import { tokensToCssVars } from '@/lib/design/styles';
import { Eye } from 'lucide-react';
import { notFound } from 'next/navigation';

/**
 * Public renderer for a published website.
 *
 * Handles the Draft case honestly: if the site is not published, only its owner
 * (signed in) sees a preview, clearly badged as a draft. Everyone else gets a
 * 404 — exactly what a visitor would see.
 */
export function PublishedSite({
  website,
  pageSlug = 'home',
  isOwner,
  basePath,
}: {
  website: Website;
  pageSlug?: string;
  isOwner: boolean;
  basePath: string;
}) {
  if (website.status !== 'published' && !isOwner) notFound();

  const page = website.pages.find((p) => p.slug === pageSlug) ?? website.pages.find((p) => p.slug === 'home');
  if (!page) notFound();

  const isDraftPreview = website.status !== 'published';

  return (
    <div style={tokensToCssVars(website.tokens)} className="site-root min-h-screen">
      {isDraftPreview ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-[0.82rem] text-amber-900">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Eye className="h-3.5 w-3.5" /> Draft preview
          </span>
          <span>Only you can see this version — visitors see a 404 until you publish.</span>
          <Link href={`/editor/${website.id}`} className="font-semibold underline">
            Back to editor
          </Link>
        </div>
      ) : null}

      <SiteRenderer website={website} page={page} showFloatingActions />

      {!isDraftPreview ? <SiteViewTracker slug={website.slug} path={basePath} /> : null}
    </div>
  );
}
