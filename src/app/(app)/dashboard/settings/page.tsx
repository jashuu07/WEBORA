import type { Metadata } from 'next';
import { PageHeading } from '@/components/dashboard/AppShell';
import { SettingsPanel } from '@/components/dashboard/SettingsPanel';
import { getCurrentUser } from '@/lib/auth/session';
import { getStore, storageStatus } from '@/lib/db';
import { PLANS } from '@/lib/plans';
import { generationEngineStatus } from '@/services/ai';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const store = getStore();
  const websites = await store.listWebsites(user.id);
  const storage = storageStatus();
  const engine = generationEngineStatus();

  const pages = websites.reduce((n, w) => n + w.pages.length, 0);

  return (
    <div>
      <PageHeading
        title="Settings"
        description="Your profile, plan and the configuration this deployment is running with."
      />
      <SettingsPanel
        user={user}
        usage={{ websites: websites.length, limit: PLANS[user.plan].limits.websites, pages }}
        storage={{ active: storage.active, detail: storage.detail, fallback: storage.fallback }}
        engine={{ engine: engine.engine, label: engine.label, detail: engine.detail }}
      />
    </div>
  );
}
