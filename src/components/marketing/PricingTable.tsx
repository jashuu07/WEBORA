'use client';

import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { PLAN_LIST } from '@/lib/plans';
import { ButtonLink } from '@/components/ui/Button';
import { formatCurrency, cn } from '@/lib/utils';

/**
 * Pricing table. WEBORA never charges on this deployment — the note under the
 * table says exactly what is (and is not) wired up.
 */
export function PricingTable({ signedIn = false }: { signedIn?: boolean }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <span className={cn('text-[0.9rem] font-medium', !yearly ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((v) => !v)}
          className={cn(
            'relative h-6 w-11 rounded-full border transition-colors duration-200',
            yearly ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--line-strong)] bg-[#ece9e4]',
          )}
        >
          <span
            className={cn('absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200', yearly ? 'translate-x-[22px]' : 'translate-x-0.5')}
            style={{ height: 18, width: 18 }}
          />
        </button>
        <span className={cn('text-[0.9rem] font-medium', yearly ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>
          Yearly
        </span>
        <span className="chip chip-accent">2 months free</span>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const price = yearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          return (
            <article
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-7',
                plan.highlight ? 'border-[var(--accent)] shadow-[0_24px_60px_-38px_rgba(242,106,27,.7)]' : 'border-[var(--line)]',
              )}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-7 rounded-full bg-[var(--accent)] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-white">
                  Recommended
                </span>
              ) : null}

              <h3 className="text-[1.15rem] font-semibold">{plan.name}</h3>
              <p className="mt-1.5 min-h-[42px] text-[0.88rem] leading-relaxed text-[var(--text-muted)]">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-[2.4rem] font-semibold leading-none tracking-[-0.03em]">
                  {price === 0 ? 'Free' : formatCurrency(price, plan.currency)}
                </span>
                {price !== 0 ? <span className="text-[0.85rem] text-[var(--text-muted)]">/month</span> : null}
              </div>
              {price !== 0 ? (
                <p className="mt-1 text-[0.78rem] text-[var(--text-muted)]">
                  {yearly ? `Billed ${formatCurrency(plan.priceYearly, plan.currency)} yearly` : 'Billed monthly'}
                </p>
              ) : (
                <p className="mt-1 text-[0.78rem] text-[var(--text-muted)]">Forever. No card required.</p>
              )}

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={2.6} />
                    <span className="text-[0.9rem] leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <ButtonLink
                href={signedIn ? `/dashboard/settings?plan=${plan.id}` : `/signup?plan=${plan.id}`}
                variant={plan.highlight ? 'primary' : 'outline'}
                className="mt-7 w-full"
              >
                {plan.id === 'free' ? 'Start free' : `Choose ${plan.name}`}
              </ButtonLink>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 text-[0.86rem] text-[var(--text-muted)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p>
          <strong className="font-semibold text-[var(--text)]">Payment processing is not enabled on this deployment.</strong>{' '}
          You can switch plans instantly from your dashboard settings while you evaluate WEBORA — no card is charged. The
          Razorpay and Stripe wiring is documented in <code className="rounded bg-[#f4f2ee] px-1.5 py-0.5 text-[0.8rem]">docs/PAYMENTS.md</code>.
        </p>
      </div>
    </div>
  );
}
