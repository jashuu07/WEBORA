'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Sparkles, X } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/templates', label: 'Templates' },
  { href: '/pricing', label: 'Pricing' },
];

export function MarketingHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(251,250,248,.82)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--surface-ink)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[1.02rem] font-semibold tracking-[-0.02em]">WEBORA</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[0.9rem] font-medium text-[var(--text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <ButtonLink href="/dashboard" variant="ink" size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary" size="sm">
                Create My Website
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className={cn('overflow-hidden border-t border-[var(--line)] md:hidden', open ? 'block' : 'hidden')}>
        <div className="flex flex-col gap-1 px-5 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[0.95rem] font-medium text-[var(--text-muted)]"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            {signedIn ? (
              <ButtonLink href="/dashboard" variant="ink" className="flex-1">
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" className="flex-1">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/signup" variant="primary" className="flex-1">
                  Get started
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--surface-ink)] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[1rem] font-semibold tracking-[-0.02em]">WEBORA</span>
          </div>
          <p className="mt-4 max-w-xs text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
            AI Business Website Studio. Describe your business — WEBORA builds a professional website you can
            customise, publish and grow.
          </p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            { href: '/how-it-works', label: 'How it works' },
            { href: '/templates', label: 'Templates' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/signup', label: 'Create a website' },
          ]}
        />
        <FooterColumn
          title="Account"
          links={[
            { href: '/login', label: 'Sign in' },
            { href: '/signup', label: 'Create account' },
            { href: '/forgot-password', label: 'Reset password' },
            { href: '/dashboard', label: 'Dashboard' },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: '/legal/terms', label: 'Terms of service' },
            { href: '/legal/privacy', label: 'Privacy policy' },
            { href: '/legal/data', label: 'Data & analytics' },
          ]}
        />
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 px-5 py-6 text-[0.82rem] text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} WEBORA. Built as a production-quality demo application.</p>
          <p>Made for small businesses in India and beyond.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{title}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-[0.9rem] text-[var(--text)] transition hover:text-[var(--accent)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
