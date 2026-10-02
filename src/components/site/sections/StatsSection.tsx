'use client';

import type { Section } from '@/types';
import { useSite } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell } from '../SectionShell';

export function StatsSection({ section }: { section: Section }) {
  const { website } = useSite();
  const props = section.props as {
    items: { value: string; label: string }[];
    variant?: 'band' | 'inline';
  };
  const items = props.items ?? [];
  const band = (props.variant ?? 'band') === 'band';
  const accent = website.tokens?.accent ?? 'var(--w-accent)';

  return (
    <Shell
      section={section}
      style={band ? { background: 'var(--w-ink)' } : undefined}
    >
      <div
        className={`grid gap-8 ${items.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}
      >
        {items.map((item, index) => (
          <div key={index} className="text-center">
            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.value`}
              value={item.value}
              as="p"
              className="text-[clamp(1.9rem,3.4vw,2.7rem)] font-semibold leading-none tracking-[-0.03em]"
              style={{ color: band ? accent : 'var(--w-text)', fontFamily: 'var(--w-heading-font)' }}
            />
            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.label`}
              value={item.label}
              as="p"
              className="mt-2.5 text-[0.86rem] font-medium uppercase tracking-[0.1em]"
              style={{ color: band ? 'rgba(255,255,255,.55)' : 'var(--w-muted)' }}
            />
          </div>
        ))}
      </div>
    </Shell>
  );
}
