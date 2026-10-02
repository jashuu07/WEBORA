'use client';

import type { Section } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { useSite } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

interface OfferItem {
  icon?: string;
  title: string;
  description: string;
  price?: string;
}

export function ServicesSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const { editable } = useSite();
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    columns?: string;
    showIcons?: boolean;
    showPrices?: boolean;
    items: OfferItem[];
  };

  const columns = Number(props.columns ?? 3);
  const gridClass =
    columns === 4
      ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-4'
      : columns === 2
        ? 'grid gap-5 sm:grid-cols-2'
        : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3';

  const items = props.items ?? [];
  const showPrices = props.showPrices !== false && items.some((i) => i.price);

  return (
    <Shell section={section} alt={alt}>
      <SectionHead section={section} />

      <div className={`${gridClass} mt-12`}>
        {items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            id={`offer-${index}`}
            className="site-card group relative flex flex-col p-6"
            style={{ background: 'var(--w-surface)' }}
          >
            {props.showIcons !== false ? (
              <span
                className="mb-5 grid h-11 w-11 place-items-center rounded-[calc(var(--w-radius)*.9)] transition-transform duration-300 group-hover:-translate-y-0.5"
                style={{ background: 'var(--w-accent-soft)', color: 'var(--w-accent)' }}
              >
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
            ) : null}

            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.title`}
              value={item.title}
              as="h3"
              className="text-[1.12rem] font-semibold leading-snug"
            />

            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.description`}
              value={item.description}
              as="p"
              multiline
              className="mt-2 flex-1 text-[0.94rem] leading-relaxed"
              style={{ color: 'var(--w-muted)' }}
            />

            {showPrices && item.price ? (
              <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--w-border)' }}>
                <EditableText
                  sectionId={section.id}
                  fieldKey={`items.${index}.price`}
                  value={item.price}
                  className="text-[0.95rem] font-semibold"
                  style={{ color: 'var(--w-accent)' }}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>

    </Shell>
  );
}
