import Link from 'next/link';
import { BarChart3, Inbox, LayoutGrid, Rocket, Sparkles, Wand2 } from 'lucide-react';
import { PageHeading } from '@/components/dashboard/AppShell';
import { WebsiteCard } from '@/components/dashboard/WebsiteCard';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, Badge } from '@/components/ui/primitives';
import { NewSiteButtons } from '@/components/dashboard/NewSiteButtons';
import { getCurrentUser } from '@/lib/auth/session';
import { getStore, storageStatus } from '@/lib/db';
import { PLANS } from '@/lib/plans';
import { compactNumber } from '@/lib/utils';
import { generationEngineStatus } from '@/services/ai';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const store = getStore();
  const websites = await store.listWebsites(user.id);
  const storage = storageStatus();
  const engine = generationEngineStatus();

  const analytics = await Promise.all(websites.map((w) => store.getAnalytics(w.id, 30)));
  const visitorsBySite = new Map(websites.map((w, i) => [w.id, analytics[i]?.visitors ?? 0]));
  const totalVisitors = analytics.reduce((sum, a) => sum + (a?.visitors ?? 0), 0);
  const totalViews = analytics.reduce((sum, a) => sum + (a?.pageViews ?? 0), 0);
  const allEnquiries = (await Promise.all(websites.map((w) => store.listEnquiries(w.id)))).flat();
  const published = websites.filter((w) => w.status === 'published');
  const limit = PLANS[user.plan].limits.websites;

  return (
    <div>
      <PageHeading
        title={`Hello, ${user.name.split(' ')[0]}`}
        description="Manage your websites, edit drafts and publish updates. Everything you change here is live immediately after publishing."
        actions={<NewSiteButtons />}
      />

      {websites.length ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Websites"
              value={`${websites.length} / ${limit}`}
              hint={user.plan === 'free' ? 'Free plan includes 1 website' : `${PLANS[user.plan].name} plan`}
            />
            <StatCard
              icon={<Rocket className="h-4 w-4" />}
              label="Published"
              value={String(published.length)}
              hint={published.length ? 'Live and reachable' : 'Nothing published yet'}
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Visitors (30d)"
              value={compactNumber(totalVisitors)}
              hint={`${compactNumber(totalViews)} page views`}
            />
            <StatCard
              icon={<Inbox className="h-4 w-4" />}
              label="Enquiries"
              value={String(allEnquiries.length)}
              hint={`${allEnquiries.filter((e) => !e.read).length} unread`}
            />
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[1.05rem] font-semibold">My websites</h2>
              <Link href="/dashboard/analytics" className="text-[0.85rem] font-medium text-[var(--accent)] hover:underline">
                View analytics
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {websites.map((site) => (
                <WebsiteCard key={site.id} website={site} visitors={visitorsBySite.get(site.id)} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="No websites yet"
          description="Describe your business in one sentence and WEBORA will generate a complete website — pages, copy, services, gallery, SEO and contact details."
          action={
            <>
              <ButtonLink href="/create" icon={<Wand2 className="h-4 w-4" />}>
                Create my website
              </ButtonLink>
              <NewSiteButtons variant="outline" label="Or load a sample site" />
            </>
          }
        />
      )}

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Generation engine
          </p>
          <div className="mt-3">
            <Badge tone={engine.engine === 'ai-provider' ? 'success' : 'neutral'}>{engine.label}</Badge>
          </div>
          <p className="mt-3 text-[0.85rem] leading-relaxed text-[var(--text-muted)]">{engine.detail}</p>
        </div>

        <div className="surface p-5">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Storage</p>
          <div className="mt-3">
            <Badge tone={storage.active === 'supabase' ? 'success' : 'neutral'}>
              {storage.active === 'supabase' ? 'Supabase Postgres' : 'Local JSON store'}
            </Badge>
          </div>
          <p className="mt-3 text-[0.85rem] leading-relaxed text-[var(--text-muted)]">{storage.detail}</p>
        </div>

        <div className="surface p-5">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Next steps</p>
          <ul className="mt-3 flex flex-col gap-2 text-[0.85rem]">
            <li>
              <Link href="/dashboard/settings" className="font-medium text-[var(--accent)] hover:underline">
                Add your logo and brand colours
              </Link>
            </li>
            <li>
              <Link href="/dashboard/domains" className="font-medium text-[var(--accent)] hover:underline">
                Connect a custom domain
              </Link>
            </li>
            <li>
              <Link href="/dashboard/enquiries" className="font-medium text-[var(--accent)] hover:underline">
                Check your contact form inbox
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-soft)] text-[#c2520d]">{icon}</span>
        <span className="text-[0.8rem] font-semibold uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-3 font-display text-[1.9rem] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      {hint ? <p className="mt-2 text-[0.8rem] text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}
