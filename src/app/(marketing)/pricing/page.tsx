import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { PricingTable } from '@/components/marketing/PricingTable';
import { Faq } from '@/components/marketing/Faq';
import { SectionHeading } from '@/components/ui/primitives';
import { getCurrentUser } from '@/lib/auth/session';
import { PLAN_LIST } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free, Starter and Pro plans for WEBORA — the AI business website studio.',
};

const COMPARISON: { label: string; values: (boolean | string)[] }[] = [
  { label: 'Published websites', values: ['1', '3', '10'] },
  { label: 'Pages per website', values: ['5', '15', 'Unlimited'] },
  { label: 'Visual editor + device previews', values: [true, true, true] },
  { label: 'Industry content library', values: [true, true, true] },
  { label: 'WhatsApp, call & map buttons', values: [true, true, true] },
  { label: 'Contact form inbox', values: [true, true, true] },
  { label: 'Remove WEBORA badge', values: [false, true, true] },
  { label: 'Basic SEO pack + sitemap', values: [false, true, true] },
  { label: 'Custom domain + SSL', values: [false, false, true] },
  { label: 'Analytics dashboard', values: [false, false, true] },
  { label: 'AI copywriting (advanced)', values: [false, false, true] },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-3">Pricing</p>
        <h1 className="display-2">Simple plans for real businesses</h1>
        <p className="lede mt-5">
          Start on Free and publish a real website today. Upgrade when you need your own domain, analytics or more
          sites.
        </p>
      </div>

      <div className="mt-14">
        <PricingTable signedIn={Boolean(user)} />
      </div>

      <section className="mt-20">
        <SectionHeading eyebrow="Compare" title="What is in each plan" />
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="px-5 py-4 text-left font-semibold">Feature</th>
                {PLAN_LIST.map((plan) => (
                  <th key={plan.id} className="px-5 py-4 text-center font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, index) => (
                <tr key={row.label} className={index % 2 ? 'bg-[var(--surface)]' : ''}>
                  <td className="px-5 py-3.5 text-[var(--text)]">{row.label}</td>
                  {row.values.map((value, i) => (
                    <td key={i} className="px-5 py-3.5 text-center">
                      {typeof value === 'string' ? (
                        <span className="font-medium">{value}</span>
                      ) : value ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={2.8} />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-[#c9c4bb]" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20">
        <SectionHeading eyebrow="FAQ" title="Billing & plan questions" />
        <div className="mt-8">
          <Faq />
        </div>
      </section>
    </div>
  );
}
