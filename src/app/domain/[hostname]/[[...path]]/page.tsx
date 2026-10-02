import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import { PublishedSite } from '@/components/site/PublishedSite';
import { getStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { dnsInstructions } from '@/lib/sites';

/**
 * Custom-domain entry point.
 *
 * WEBORA resolves a hostname to its website and renders it. On a host that can
 * route by domain (Vercel with the domain attached, or a reverse proxy), point
 * the request here with the hostname forwarded (see docs/DEPLOYMENT.md).
 *
 * When the domain is registered but not yet resolvable, we render the setup
 * instructions instead of a blank 404 — so the owner always knows the next step.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ hostname: string; path?: string[] }>;
}): Promise<Metadata> {
  const { hostname } = await params;
  const website = await getStore().getWebsiteByDomain(hostname);
  if (!website || website.status !== 'published') return { title: `${hostname} · WEBORA` };

  const segments = (await params).path ?? [];
  const slug = segments[0] ?? 'home';
  const page = website.pages.find((p) => p.slug === slug) ?? website.pages.find((p) => p.slug === 'home');
  const seo = page?.seo ?? website.seo;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: { title: seo.title, description: seo.description, siteName: website.name, type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ hostname: string; path?: string[] }>;
}) {
  const { hostname, path: segments } = await params;
  const [website, user] = await Promise.all([getStore().getWebsiteByDomain(hostname), getCurrentUser()]);

  if (!website) {
    const { requirements } = dnsInstructions(hostname);
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[#c2520d]">
          <Globe2 className="h-5 w-5" />
        </span>
        <h1 className="mt-5 font-display text-[1.9rem] font-semibold tracking-[-0.02em]">
          {hostname} is not connected to a WEBORA website yet
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
          This hostname is either not registered in WEBORA or has not finished DNS verification. If this domain is
          yours, complete the setup below — or sign in and connect it from your dashboard.
        </p>

        <ol className="mt-6 flex flex-col gap-3">
          {requirements.map((requirement, index) => (
            <li key={requirement} className="flex gap-3 text-[0.9rem]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--surface-ink)] text-[0.72rem] font-semibold text-white">
                {index + 1}
              </span>
              <span className="leading-relaxed text-[var(--text-muted)]">{requirement}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/domains" className="btn btn-primary">
            Connect a domain
          </Link>
          <Link href="/" className="btn btn-outline">
            Back to WEBORA
          </Link>
        </div>
      </main>
    );
  }

  const pageSlug = segments?.[0] ?? 'home';
  const isValid = website.pages.some((p) => p.slug === pageSlug);
  if (!isValid) notFound();

  return (
    <PublishedSite
      website={website}
      pageSlug={pageSlug}
      isOwner={Boolean(user && user.id === website.userId)}
      basePath={`/${pageSlug === 'home' ? '' : pageSlug}`}
    />
  );
}
