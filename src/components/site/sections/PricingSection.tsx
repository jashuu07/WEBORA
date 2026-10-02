'use client';

import { Check } from 'lucide-react';
import type { Section } from '@/types';
import { useSite } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string;
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
}

export function PricingSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const ctx = useSite();
  const { editable } = ctx;
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    note?: string;
    items: Plan[];
  };

  const plans = props.items ?? [];
  const gridCols = plans.length >= 4 ? 'lg:grid-cols-4' : plans.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <Shell section={section} alt={alt}>
      <SectionHead section={section} align="center" />

      <div className={`mt-12 grid gap-5 sm:grid-cols-2 ${gridCols}`}>
        {plans.map((plan, index) => {
          const features = (plan.features ?? '').split('\n').filter(Boolean);
          return (
            <article
              key={`${plan.name}-${index}`}
              className="site-card relative flex flex-col p-6"
              style={
                plan.highlight
                  ? { borderColor: 'var(--w-accent)', boxShadow: '0 20px 46px -30px var(--w-accent)' }
                  : undefined
              }
            >
              {plan.highlight ? (
                <span
                  className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-white"
                  style={{ background: 'var(--w-accent)' }}
                >
                  Most popular
                </span>
              ) : null}

              <EditableText
                sectionId={section.id}
                fieldKey={`items.${index}.name`}
                value={plan.name}
                as="h3"
                className="text-[1.05rem] font-semibold"
              />

              <div className="mt-3 flex items-baseline gap-1.5">
                <EditableText
                  sectionId={section.id}
                  fieldKey={`items.${index}.price`}
                  value={plan.price}
                  as="span"
                  className="text-[2rem] font-semibold leading-none tracking-[-0.03em]"
                  style={{ fontFamily: 'var(--w-heading-font)' }}
                />
                {plan.period ? (
                  <EditableText
                    sectionId={section.id}
                    fieldKey={`items.${index}.period`}
                    value={plan.period}
                    className="text-[0.85rem]"
                    style={{ color: 'var(--w-muted)' }}
                  />
                ) : null}
              </div>

              {plan.description ? (
                <EditableText
                  sectionId={section.id}
                  fieldKey={`items.${index}.description`}
                  value={plan.description}
                  as="p"
                  multiline
                  className="mt-2.5 text-[0.9rem] leading-relaxed"
                  style={{ color: 'var(--w-muted)' }}
                />
              ) : null}

              <div className="my-5 h-px" style={{ background: 'var(--w-border)' }} />

              <ul className="flex flex-1 flex-col gap-3">
                {features.map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.6} style={{ color: 'var(--w-accent)' }} />
                    <span className="text-[0.92rem] leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={editable ? undefined : ctx.resolveHref(plan.ctaHref || '/contact')}
                onClick={(e) => editable && e.preventDefault()}
                className={`site-btn mt-6 ${plan.highlight ? 'site-btn-primary' : 'site-btn-secondary'}`}
              >
                <EditableText sectionId={section.id} fieldKey={`items.${index}.ctaLabel`} value={plan.ctaLabel} />
              </a>
            </article>
          );
        })}
      </div>

      {props.note ? (
        <EditableText
          sectionId={section.id}
          fieldKey="note"
          value={props.note}
          as="p"
          className="mt-8 text-center text-[0.85rem]"
          style={{ color: 'var(--w-muted)' }}
        />
      ) : null}
    </Shell>
  );
}
