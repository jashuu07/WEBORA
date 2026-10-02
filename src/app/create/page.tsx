import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { generationEngineStatus } from '@/services/ai';
import { getDemoSites } from '@/lib/demo-sites';
import { CreateStudio } from '@/components/studio/CreateStudio';

export const metadata: Metadata = {
  title: 'Website studio',
  description: 'Describe your business on the left, watch the website build in the middle, tune it on the right.',
};

/**
 * The website studio.
 *
 * Left: business information · Centre: live 3D preview · Right: AI controls.
 * The starter websites are real pipeline output (cached server-side), shown
 * until the owner has typed enough for their own live draft.
 */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; site?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/create');

  const params = await searchParams;
  const engine = generationEngineStatus();
  const starters = await getDemoSites(['bakery', 'salon', 'gym']);

  return (
    <CreateStudio
      defaultName={user.company?.trim() || ''}
      defaultTemplate={params.template}
      engine={{ engine: engine.engine, label: engine.label, detail: engine.detail }}
      starters={starters}
    />
  );
}
