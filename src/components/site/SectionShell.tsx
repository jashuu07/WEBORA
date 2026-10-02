'use client';

import { cn } from '@/lib/utils';
import type { Section } from '@/types';
import { useSite } from './SectionContext';
import { EditableText } from './Editable';

const PAD_Y: Record<string, string> = {
  sm: '2.75rem',
  md: '4rem',
  lg: '5.5rem',
  xl: '7rem',
};

const PAD_X: Record<string, string> = {
  sm: '1rem',
  md: '1.5rem',
  lg: '2.5rem',
};

/**
 * Consistent section frame: vertical rhythm from the design tokens, content
 * width, alignment and the editor's click-to-select behaviour.
 */
export function Shell({
  section,
  children,
  alt = false,
  className,
  bleed = false,
  dark = false,
  style,
}: {
  section: Section;
  children: React.ReactNode;
  alt?: boolean;
  className?: string;
  bleed?: boolean;
  dark?: boolean;
  style?: React.CSSProperties;
}) {
  const ctx = useSite();
  const { editable, onSelectSection } = ctx;

  return (
    <section
      id={`sec-${section.id}`}
      data-section-id={section.id}
      onClick={
        editable
          ? (event) => {
              event.stopPropagation();
              onSelectSection?.(section.id);
            }
          : undefined
      }
      className={cn('relative', alt && 'site-section-alt', className)}
      style={{
        paddingTop: `calc(${PAD_Y[section.spacing?.paddingY ?? 'lg']} * var(--w-rhythm))`,
        paddingBottom: `calc(${PAD_Y[section.spacing?.paddingY ?? 'lg']} * var(--w-rhythm))`,
        background: dark ? 'var(--w-surface-alt)' : undefined,
        ...style,
      }}
    >
      {bleed ? (
        children
      ) : (
        <div
          className="site-wrap"
          style={{
            maxWidth: section.spacing?.width ?? 1200,
            paddingLeft: PAD_X[section.spacing?.paddingX ?? 'md'],
            paddingRight: PAD_X[section.spacing?.paddingX ?? 'md'],
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

/** Eyebrow + heading + supporting text, all inline-editable. */
export function SectionHead({
  section,
  eyebrowKey = 'eyebrow',
  headingKey = 'heading',
  subKey = 'sub',
  align = 'left',
  invert = false,
}: {
  section: Section;
  eyebrowKey?: string;
  headingKey?: string;
  subKey?: string;
  align?: 'left' | 'center';
  invert?: boolean;
}) {
  const props = section.props as Record<string, string>;
  const eyebrow = props[eyebrowKey];
  const heading = props[headingKey];
  const sub = props[subKey];

  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <EditableText
          sectionId={section.id}
          fieldKey={eyebrowKey}
          value={eyebrow}
          as="p"
          className="site-eyebrow mb-3"
        />
      ) : null}
      {heading ? (
        <EditableText
          sectionId={section.id}
          fieldKey={headingKey}
          value={heading}
          as="h2"
          className="text-[clamp(1.7rem,3.2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em]"
          style={invert ? { color: '#fff' } : undefined}
        />
      ) : null}
      {sub ? (
        <EditableText
          sectionId={section.id}
          fieldKey={subKey}
          value={sub}
          as="p"
          multiline
          className="mt-3.5 text-[1.02rem] leading-relaxed"
          style={{ color: invert ? 'rgba(255,255,255,.72)' : 'var(--w-muted)' }}
        />
      ) : null}
    </div>
  );
}
