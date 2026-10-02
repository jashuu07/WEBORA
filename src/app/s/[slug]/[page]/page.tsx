import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublishedSite } from '@/components/site/PublishedSite';
import { getStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page: pageSlug } = await params;
  const website = await getStore().getWebsiteBySlug(slug);
  const page = website?.pages.find((p) => p.slug === pageSlug);
  if (!website || !page || website.status !== 'published') {
    return { title: 'Page not found' };
  }
  const url = `/s/${website.slug}/${page.slug}`;
  return {
    title: page.seo.title,
    description: page.seo.description,
    keywords: page.seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: page.seo.title,
      description: page.seo.description,
      url,
      siteName: website.name,
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublishedSubPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page: pageSlug } = await params;
  const [website, user] = await Promise.all([getStore().getWebsiteBySlug(slug), getCurrentUser()]);
  if (!website) notFound();

  return (
    <PublishedSite
      website={website}
      pageSlug={pageSlug}
      isOwner={Boolean(user && user.id === website.userId)}
      basePath={`/${pageSlug}`}
    />
  );
}
