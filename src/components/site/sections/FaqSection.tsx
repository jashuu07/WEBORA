'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Section } from '@/types';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

export function FaqSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    items: { q: string; a: string }[];
  };
  const items = props.items ?? [];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Shell section={section} alt={alt}>
      <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
        <SectionHead section={section} />

        <div className="divide-y" style={{ borderColor: 'var(--w-border)' }}>
          {items.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={index} className="py-1" style={{ borderColor: 'var(--w-border)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-start justify-between gap-4 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <EditableText
                    sectionId={section.id}
                    fieldKey={`items.${index}.q`}
                    value={item.q}
                    as="span"
                    className="text-[1.02rem] font-semibold leading-snug"
                  />
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition"
                    style={{ borderColor: 'var(--w-border)' }}
                  >
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
                <div
                  className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                >
                  <EditableText
                    sectionId={section.id}
                    fieldKey={`items.${index}.a`}
                    value={item.a}
                    as="p"
                    multiline
                    className="min-h-0 pb-5 pr-10 text-[0.95rem] leading-relaxed"
                    style={{ color: 'var(--w-muted)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
