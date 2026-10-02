import { Inbox } from 'lucide-react';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/dashboard/AppShell';
import { EnquiriesInbox } from '@/components/dashboard/EnquiriesInbox';
import { getCurrentUser } from '@/lib/auth/session';
import { getStore } from '@/lib/db';

export const metadata: Metadata = { title: 'Enquiries' };

export default async function EnquiriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const store = getStore();
  const websites = await store.listWebsites(user.id);
  const groups = await Promise.all(
    websites.map(async (website) => ({ website, enquiries: await store.listEnquiries(website.id) })),
  );

  return (
    <div>
      <PageHeading
        title="Enquiries"
        description="Messages sent through the contact form on your published websites. They are stored here — nothing is emailed out unless you connect a mail provider."
      />
      <EnquiriesInbox groups={groups} />
      {!websites.length ? (
        <p className="mt-6 text-[0.9rem] text-[var(--text-muted)]">
          <Inbox className="mr-1.5 inline h-4 w-4" />
          Create a website to start collecting enquiries.
        </p>
      ) : null}
    </div>
  );
}
