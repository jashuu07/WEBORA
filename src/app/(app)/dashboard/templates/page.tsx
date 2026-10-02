import type { Metadata } from 'next';
import { PageHeading } from '@/components/dashboard/AppShell';
import { TemplateShowcase } from '@/components/marketing/TemplateShowcase';
import { ButtonLink } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = { title: 'Templates' };

export default async function DashboardTemplatesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const limit = PLANS[user.plan].limits.websites;

  return (
    <div>
      <PageHeading
        title="Templates"
        description={`Pick a starting point for your next website. Your ${user.plan} plan allows ${limit} website${limit === 1 ? '' : 's'}.`}
        actions={<ButtonLink href="/create" icon={<Sparkles className="h-4 w-4" />}>Create with the wizard</ButtonLink>}
      />

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
        Choosing a template starts the wizard with that layout pre-selected — your industry, section order and imagery
        are prepared, then WEBORA writes the content from your business details. You can change template later inside the
        editor under <strong className="font-medium text-[var(--text)]">Theme</strong>.
      </div>

      <div className="mt-8">
        <TemplateShowcase />
      </div>
    </div>
  );
}
