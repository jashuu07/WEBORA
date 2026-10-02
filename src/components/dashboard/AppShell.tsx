'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Globe2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import type { User } from '@/types';
import { Avatar, Badge } from '@/components/ui/primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'My websites', icon: LayoutDashboard },
  { href: '/dashboard/templates', label: 'Templates', icon: Sparkles },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/enquiries', label: 'Enquiries', icon: Inbox },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  user,
  unreadEnquiries = 0,
  children,
}: {
  user: User;
  unreadEnquiries?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    toast({ title: 'Signed out', tone: 'info' });
    router.push('/');
    router.refresh();
  }

  const plan = PLANS[user.plan];

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--surface-ink)] text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[1.02rem] font-semibold tracking-[-0.02em]">WEBORA</span>
      </Link>

      <div className="px-3">
        <ButtonLink href="/create" className="w-full" icon={<Plus className="h-4 w-4" />}>
          New website
        </ButtonLink>
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-0.5 px-3" aria-label="Dashboard">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-medium transition-colors',
                active
                  ? 'bg-[var(--surface-ink)] text-white'
                  : 'text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.href === '/dashboard/enquiries' && unreadEnquiries > 0 ? (
                <span className="ml-auto rounded-full bg-[var(--accent)] px-2 py-0.5 text-[0.68rem] font-bold text-white">
                  {unreadEnquiries}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)] p-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {plan.name} plan
            </span>
            {user.plan !== 'pro' ? (
              <Link href="/dashboard/settings" className="text-[0.76rem] font-semibold text-[var(--accent)] hover:underline">
                Upgrade
              </Link>
            ) : (
              <Badge tone="success">Active</Badge>
            )}
          </div>
          <p className="mt-2 text-[0.78rem] leading-relaxed text-[var(--text-muted)]">
            {plan.limits.websites} website{plan.limits.websites === 1 ? '' : 's'} · {plan.limits.pages} pages
            {plan.limits.customDomain ? ' · custom domain' : ''}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.name} color={user.avatarColor} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.86rem] font-semibold">{user.name}</p>
            <p className="truncate text-[0.76rem] text-[var(--text-muted)]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--text)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-[var(--line)] bg-white lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[rgba(16,17,20,.4)]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[280px] animate-fade-in border-r border-[var(--line)] bg-white">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[rgba(251,250,248,.86)] px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)]"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-[1rem] font-semibold tracking-[-0.02em]">WEBORA</span>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href="/create" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
              New
            </ButtonLink>
            <Avatar name={user.name} color={user.avatarColor} size={32} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.92rem] text-[var(--text-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { Button, X };
