'use client';

import { Check } from 'lucide-react';
import type { Section } from '@/types';
import { useSite } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

export function AboutSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const { editable } = useSite();
  const props = section.props as {
    eyebrow: string;
    heading: string;
    body: string;
    image?: string;
    layout?: 'image-left' | 'image-right' | 'no-image';
    items?: { text: string }[];
  };

  const layout = props.layout ?? 'image-left';
  const bullets = props.items ?? [];
  const hasImage = Boolean(props.image) && layout !== 'no-image';

  const copy = (
    <div>
      <SectionHead section={section} />
      {bullets.length ? (
        <ul className="mt-7 flex flex-col gap-3">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                style={{ background: 'var(--w-accent-soft)', color: 'var(--w-accent)' }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <EditableText
                sectionId={section.id}
                fieldKey={`items.${index}.text`}
                value={bullet.text}
                as="span"
                className="text-[0.98rem] leading-relaxed"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  if (!hasImage) {
    return (
      <Shell section={section} alt={alt}>
        <div className="max-w-3xl">{copy}</div>
      </Shell>
    );
  }

  return (
    <Shell section={section} alt={alt}>
      <div className={`grid items-center gap-12 lg:gap-16 ${layout === 'image-right' ? 'lg:grid-cols-[1.05fr_.95fr]' : 'lg:grid-cols-[.95fr_1.05fr]'}`}>
        <div className={layout === 'image-right' ? 'lg:order-2' : ''}>
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: 'calc(var(--w-radius) * 1.6)',
              boxShadow: '0 20px 50px -30px rgba(0,0,0,.45)',
              aspectRatio: '4 / 3.2',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
          {editable ? (
            <p className="mt-2 text-[0.72rem]" style={{ color: 'var(--w-muted)' }}>
              Replace this image from the inspector → Content → Image.
            </p>
          ) : null}
        </div>
        <div className={layout === 'image-right' ? 'lg:order-1' : ''}>{copy}</div>
      </div>
    </Shell>
  );
}
