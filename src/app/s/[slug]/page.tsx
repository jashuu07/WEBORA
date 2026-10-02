import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublishedSite } from '@/components/site/PublishedSite';
import { getStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const website = await getStore().getWebsiteBySlug(slug);
  if (!website || website.status !== 'published') {
    return { title: 'Website not found' };
  }
  const home = website.pages.find((p) => p.slug === 'home');
  const seo = home?.seo ?? website.seo;
  const url = `/s/${website.slug}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: website.name,
      type: 'website',
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description },
    robots: { index: true, follow: true },
  };
}

export default async function PublishedHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [website, user] = await Promise.all([getStore().getWebsiteBySlug(slug), getCurrentUser()]);
  if (!website) notFound();

  return (
    <PublishedSite
      website={website}
      pageSlug="home"
      isOwner={Boolean(user && user.id === website.userId)}
      basePath="/"
    />
  );
}
