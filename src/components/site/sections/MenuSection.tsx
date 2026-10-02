'use client';

import type { Section } from '@/types';
import { useSite } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

interface MenuItem {
  name: string;
  description: string;
  price: string;
  tag?: string;
}
interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export function MenuSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const { editable, website } = useSite();
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    note?: string;
    items: MenuCategory[];
  };

  const categories = props.items ?? [];
  const accent = website.tokens?.accent ?? 'var(--w-accent)';

  return (
    <Shell section={section} alt={alt}>
      <SectionHead section={section} />

      <div className={`mt-12 grid gap-x-16 gap-y-12 ${categories.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {categories.map((category, ci) => (
          <div key={`${category.name}-${ci}`}>
            <div className="mb-5 flex items-center gap-4">
              <EditableText
                sectionId={section.id}
                fieldKey={`items.${ci}.name`}
                value={category.name}
                as="h3"
                className="text-[0.85rem] font-semibold uppercase tracking-[0.16em]"
                style={{ color: accent }}
              />
              <span className="h-px flex-1" style={{ background: 'var(--w-border)' }} />
            </div>

            <ul className="flex flex-col gap-4">
              {(category.items ?? []).map((item, ii) => (
                <li key={`${item.name}-${ii}`} className="group">
                  <div className="flex items-baseline gap-3">
                    <EditableText
                      sectionId={section.id}
                      fieldKey={`items.${ci}.items.${ii}.name`}
                      value={item.name}
                      as="h4"
                      className="text-[1.02rem] font-semibold"
                    />
                    {item.tag ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide"
                        style={{ background: 'var(--w-accent-soft)', color: 'var(--w-accent)' }}
                      >
                        <EditableText sectionId={section.id} fieldKey={`items.${ci}.items.${ii}.tag`} value={item.tag} />
                      </span>
                    ) : null}
                    <span className="mb-1 h-px flex-1 opacity-60" style={{ background: 'var(--w-border)' }} />
                    <EditableText
                      sectionId={section.id}
                      fieldKey={`items.${ci}.items.${ii}.price`}
                      value={item.price}
                      className="text-[0.98rem] font-semibold tabular-nums"
                    />
                  </div>
                  {item.description ? (
                    <EditableText
                      sectionId={section.id}
                      fieldKey={`items.${ci}.items.${ii}.description`}
                      value={item.description}
                      as="p"
                      className="mt-1 text-[0.9rem] leading-relaxed"
                      style={{ color: 'var(--w-muted)' }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {props.note ? (
        <EditableText
          sectionId={section.id}
          fieldKey="note"
          value={props.note}
          as="p"
          multiline
          className="mt-12 text-[0.85rem]"
          style={{ color: 'var(--w-muted)' }}
        />
      ) : null}

      {editable ? (
        <p className="mt-6 text-[0.75rem]" style={{ color: 'var(--w-muted)' }}>
          Tip: edit categories and dishes in the inspector (Content → Categories).
        </p>
      ) : null}
    </Shell>
  );
}
