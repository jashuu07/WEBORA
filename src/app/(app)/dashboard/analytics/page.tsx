import { BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';
import { PageHeading } from '@/components/dashboard/AppShell';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import { getCurrentUser } from '@/lib/auth/session';
import { getStore } from '@/lib/db';
import { PLANS } from '@/lib/plans';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const websites = await getStore().listWebsites(user.id);
  const analyticsAllowed = PLANS[user.plan].limits.analytics;

  return (
    <div>
      <PageHeading
        title="Analytics"
        description="First-party visit data recorded by WEBORA itself — no third-party analytics script, no cookies."
      />

      {!analyticsAllowed ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-[0.9rem] font-semibold text-amber-900">
              The analytics dashboard is part of the Pro plan
            </p>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-amber-800">
              Your site still records page views. Switch to Pro from{' '}
              <a href="/dashboard/settings" className="font-semibold underline">
                Settings
              </a>{' '}
              to see the full breakdown — plan changes are instant while payments are disabled.
            </p>
          </div>
        </div>
      ) : null}

      <AnalyticsPanel websites={websites} />

      <section className="mt-8 surface p-5">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold">
          <BarChart3 className="h-4 w-4 text-[var(--accent)]" /> How this data is collected
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">
          <li>• A page view is recorded server-side when a visitor loads a page on your published site.</li>
          <li>• We store the path, device class (mobile/tablet/desktop) and the referrer host — nothing more.</li>
          <li>• No cookies, no fingerprinting, no personal data, and nothing is shared with third parties.</li>
          <li>• Numbers labelled “Demo data” come from the sample-site seeder, not real visitors.</li>
        </ul>
      </section>
    </div>
  );
}
