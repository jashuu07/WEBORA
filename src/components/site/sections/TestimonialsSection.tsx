'use client';

import { Quote, Star } from 'lucide-react';
import type { Section } from '@/types';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

interface Review {
  quote: string;
  name: string;
  role?: string;
  rating?: number;
}

export function TestimonialsSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    layout?: 'cards' | 'feature';
    items: Review[];
  };

  const items = props.items ?? [];
  const feature = props.layout === 'feature' && items[0];

  if (feature) {
    return (
      <Shell section={section} alt={alt}>
        <div className="mx-auto max-w-3xl text-center">
          <Quote className="mx-auto h-8 w-8" style={{ color: 'var(--w-accent)' }} />
          <EditableText
            sectionId={section.id}
            fieldKey="items.0.quote"
            value={feature.quote}
            as="blockquote"
            multiline
            className="mt-6 text-[clamp(1.3rem,2.6vw,1.9rem)] font-medium leading-[1.4] tracking-[-0.01em]"
            style={{ fontFamily: 'var(--w-heading-font)' }}
          />
          <div className="mt-6 flex items-center justify-center gap-1">
            {Array.from({ length: feature.rating ?? 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4" style={{ color: 'var(--w-accent)' }} fill="currentColor" />
            ))}
          </div>
          <p className="mt-4 text-[0.9rem] font-semibold">
            <EditableText sectionId={section.id} fieldKey="items.0.name" value={feature.name} />
            {feature.role ? (
              <EditableText
                sectionId={section.id}
                fieldKey="items.0.role"
                value={feature.role}
                className="ml-2 font-normal"
                style={{ color: 'var(--w-muted)' }}
              />
            ) : null}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell section={section} alt={alt}>
      <SectionHead section={section} />

      <div className={`mt-12 grid gap-5 ${items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {items.map((review, index) => (
          <figure key={index} className="site-card flex flex-col p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.max(1, Math.min(5, review.rating ?? 5)) }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" style={{ color: 'var(--w-accent)' }} fill="currentColor" />
              ))}
            </div>
            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.quote`}
              value={review.quote}
              as="blockquote"
              multiline
              className="mt-4 flex-1 text-[0.98rem] leading-relaxed"
            />
            <figcaption className="mt-5 border-t pt-4" style={{ borderColor: 'var(--w-border)' }}>
              <EditableText
                sectionId={section.id}
                fieldKey={`items.${index}.name`}
                value={review.name}
                as="span"
                className="block text-[0.9rem] font-semibold"
              />
              {review.role ? (
                <EditableText
                  sectionId={section.id}
                  fieldKey={`items.${index}.role`}
                  value={review.role}
                  as="span"
                  className="mt-0.5 block text-[0.82rem]"
                  style={{ color: 'var(--w-muted)' }}
                />
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </Shell>
  );
}
