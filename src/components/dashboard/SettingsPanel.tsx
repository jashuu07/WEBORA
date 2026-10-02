'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CreditCard, Database, Info, LogOut, Save, Sparkles, UserCog } from 'lucide-react';
import type { PlanId, User } from '@/types';
import { Badge, Avatar } from '@/components/ui/primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { PLAN_LIST, PLANS } from '@/lib/plans';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export function SettingsPanel({
  user,
  usage,
  storage,
  engine,
}: {
  user: User;
  usage: { websites: number; limit: number; pages: number };
  storage: { active: string; detail: string; fallback: boolean };
  engine: { engine: string; label: string; detail: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name: user.name, company: user.company ?? '', phone: user.phone ?? '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [switching, setSwitching] = useState<PlanId | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{ setupRequirements: string[]; message: string } | null>(null);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not save your profile.');
      toast({ title: 'Profile updated', tone: 'success' });
      router.refresh();
    } catch (error) {
      toast({ title: 'Could not save', description: (error as Error).message, tone: 'error' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePlan(plan: PlanId) {
    setSwitching(plan);
    setPaymentInfo(null);
    try {
      // Ask the billing endpoint first: it reports honestly whether payment
      // processing exists on this deployment.
      const checkout = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: plan === 'free' ? 'starter' : plan, interval: 'monthly' }),
      });
      const checkoutJson = await checkout.json();
      if (checkoutJson.ok && checkoutJson.data?.configured === false) {
        setPaymentInfo({ setupRequirements: checkoutJson.data.setupRequirements, message: checkoutJson.data.message });
      }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not change your plan.');
      toast({
        title: `Switched to ${PLANS[plan].name}`,
        description: json.data.paymentProcessed ? 'Payment received.' : 'No payment was taken — payments are disabled on this deployment.',
        tone: 'success',
      });
      router.refresh();
    } catch (error) {
      toast({ title: 'Could not change plan', description: (error as Error).message, tone: 'error' });
    } finally {
      setSwitching(null);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <div className="flex flex-col gap-6">
        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-[1rem] font-semibold">
            <UserCog className="h-4 w-4 text-[var(--accent)]" /> Profile
          </h2>
          <div className="mt-5 flex items-center gap-4">
            <Avatar name={user.name} color={user.avatarColor} size={52} />
            <div>
              <p className="text-[0.95rem] font-semibold">{user.name}</p>
              <p className="text-[0.84rem] text-[var(--text-muted)]">{user.email}</p>
              <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TextInput label="Name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            <TextInput
              label="Business name"
              value={profile.company}
              onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
            />
            <TextInput
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
            <TextInput label="Email" value={user.email} disabled hint="used to sign in" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button loading={savingProfile} onClick={saveProfile} icon={<Save className="h-4 w-4" />}>
              Save profile
            </Button>
            <Button variant="ghost" onClick={signOut} icon={<LogOut className="h-3.5 w-3.5" />}>
              Sign out
            </Button>
          </div>
        </section>

        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-[1rem] font-semibold">
            <CreditCard className="h-4 w-4 text-[var(--accent)]" /> Plan & billing
          </h2>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">
            You are on the <strong className="font-semibold text-[var(--text)]">{PLANS[user.plan].name}</strong> plan —
            using {usage.websites} of {usage.limit} websites and {usage.pages} pages across your sites.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {PLAN_LIST.map((plan) => {
              const active = plan.id === user.plan;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'flex flex-col rounded-2xl border p-4',
                    active ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[0.95rem] font-semibold">{plan.name}</p>
                    {active ? <Badge tone="accent">Current</Badge> : null}
                  </div>
                  <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.02em]">
                    {plan.priceMonthly === 0 ? 'Free' : formatCurrency(plan.priceMonthly)}
                    {plan.priceMonthly ? <span className="text-[0.8rem] font-normal text-[var(--text-muted)]">/mo</span> : null}
                  </p>
                  <p className="mt-2 flex-1 text-[0.8rem] leading-relaxed text-[var(--text-muted)]">{plan.tagline}</p>
                  <Button
                    size="sm"
                    variant={active ? 'ghost' : 'outline'}
                    className="mt-4"
                    disabled={active}
                    loading={switching === plan.id}
                    onClick={() => changePlan(plan.id)}
                  >
                    {active ? 'Current plan' : plan.priceMonthly === 0 ? 'Downgrade' : 'Switch plan'}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <p className="text-[0.84rem] leading-relaxed text-[var(--text-muted)]">
              <strong className="font-semibold text-[var(--text)]">No payment is taken on this deployment.</strong> Switching a
              plan updates your workspace limits immediately so you can evaluate features. Razorpay and Stripe integration
              points are documented in <code className="rounded bg-white px-1.5 py-0.5">docs/PAYMENTS.md</code>.
            </p>
          </div>

          {paymentInfo ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--line-strong)] p-4">
              <p className="text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                To enable real payments
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[0.82rem] leading-relaxed text-[var(--text-muted)]">
                {paymentInfo.setupRequirements.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-[1rem] font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" /> Generation engine
          </h2>
          <div className="mt-3">
            <Badge tone={engine.engine === 'ai-provider' ? 'success' : 'neutral'}>{engine.label}</Badge>
          </div>
          <p className="mt-3 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">{engine.detail}</p>
          <p className="mt-3 text-[0.82rem] text-[var(--text-muted)]">
            Add <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">AI_PROVIDER</code> and{' '}
            <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">AI_API_KEY</code> to your environment to switch
            on model-written copy.
          </p>
        </section>

        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-[1rem] font-semibold">
            <Database className="h-4 w-4 text-[var(--accent)]" /> Storage
          </h2>
          <div className="mt-3">
            <Badge tone={storage.active === 'supabase' ? 'success' : 'neutral'}>
              {storage.active === 'supabase' ? 'Supabase Postgres' : 'Local JSON store'}
            </Badge>
          </div>
          <p className="mt-3 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">{storage.detail}</p>
          {storage.fallback ? (
            <p className="mt-3 text-[0.82rem] font-medium text-amber-700">
              STORAGE_DRIVER was set to supabase but credentials are missing.
            </p>
          ) : null}
          <p className="mt-3 text-[0.82rem] text-[var(--text-muted)]">
            Migrations live in <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">database/migrations</code>; run{' '}
            <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">npm run db:migrate</code> after setting{' '}
            <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">DATABASE_URL</code>.
          </p>
        </section>

        <section className="surface p-6">
          <h2 className="flex items-center gap-2 text-[1rem] font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What is wired up
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-[0.85rem] leading-relaxed text-[var(--text-muted)]">
            <li>• Accounts, sessions, password reset (link mode) — working</li>
            <li>• Generation, editing, publishing, analytics, enquiries — working</li>
            <li>• Custom domains — records + verification instructions (hosting API optional)</li>
            <li>• Payments — architecture only, nothing charged</li>
            <li>• Email delivery — not configured; reset links are shown in-app</li>
          </ul>
          <ButtonLink href="/how-it-works" variant="outline" size="sm" className="mt-4">
            How WEBORA works
          </ButtonLink>
        </section>
      </div>
    </div>
  );
}
