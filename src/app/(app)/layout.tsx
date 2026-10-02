import { redirect } from 'next/navigation';
import { AppShell } from '@/components/dashboard/AppShell';
import { getCurrentUser } from '@/lib/auth/session';
import { getStore } from '@/lib/db';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');

  // Unread enquiries badge across the user's websites.
  const store = getStore();
  const websites = await store.listWebsites(user.id);
  const enquiryLists = await Promise.all(websites.map((w) => store.listEnquiries(w.id)));
  const unread = enquiryLists.flat().filter((e) => !e.read).length;

  return (
    <AppShell user={user} unreadEnquiries={unread}>
      {children}
    </AppShell>
  );
}
