import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Editor } from '@/components/editor/Editor';
import { getCurrentUser } from '@/lib/auth/session';
import { getOwnedWebsite } from '@/lib/sites';
import { listStockImages } from '@/lib/media/stock-server';

export const metadata: Metadata = {
  title: 'Website editor',
  description: 'Edit your WEBORA website: text, sections, images, colours and SEO.',
};

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');

  const { id } = await params;
  const website = await getOwnedWebsite(id, user.id);
  if (!website) notFound();

  // Resolved on the server: the picker only offers images that exist on disk.
  const libraryImages = await listStockImages();

  return <Editor initialWebsite={website} libraryImages={libraryImages} />;
}
