import type { Metadata } from 'next';
import { PageHeading } from '@/components/dashboard/AppShell';
import { DomainsPanel } from '@/components/dashboard/DomainsPanel';
import { getCurrentUser } from '@/lib/auth/session';
import { getStore } from '@/lib/db';

export const metadata: Metadata = { title: 'Domains' };

export default async function DomainsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const websites = await getStore().listWebsites(user.id);

  return (
    <div>
      <PageHeading
        title="Domains"
        description="Connect your own domain to a website, or copy the free webora.app address. DNS records are generated for you."
      />
      <DomainsPanel websites={websites} />
    </div>
  );
}
