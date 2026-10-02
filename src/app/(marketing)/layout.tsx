import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingChrome';
import { getCurrentUser } from '@/lib/auth/session';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader signedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
