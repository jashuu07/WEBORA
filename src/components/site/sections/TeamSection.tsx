'use client';

import type { Section } from '@/types';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

interface Member {
  name: string;
  role: string;
  bio?: string;
  image?: string;
}

export function TeamSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    items: Member[];
  };
  const members = props.items ?? [];

  return (
    <Shell section={section} alt={alt}>
      <SectionHead section={section} align="center" />

      <div className={`mt-12 grid gap-6 ${members.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {members.map((member, index) => (
          <article key={index} className="text-center">
            <div
              className="mx-auto mb-5 grid place-items-center overflow-hidden"
              style={{
                width: 116,
                height: 116,
                borderRadius: '50%',
                background: member.image ? 'transparent' : 'var(--w-accent-soft)',
                border: '1px solid var(--w-border)',
              }}
            >
              {member.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.image} alt={member.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-[1.7rem] font-semibold" style={{ color: 'var(--w-accent)' }}>
                  {member.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.name`}
              value={member.name}
              as="h3"
              className="text-[1.05rem] font-semibold"
            />
            <EditableText
              sectionId={section.id}
              fieldKey={`items.${index}.role`}
              value={member.role}
              as="p"
              className="mt-1 text-[0.85rem] font-medium"
              style={{ color: 'var(--w-accent)' }}
            />
            {member.bio ? (
              <EditableText
                sectionId={section.id}
                fieldKey={`items.${index}.bio`}
                value={member.bio}
                as="p"
                multiline
                className="mt-2.5 text-[0.9rem] leading-relaxed"
                style={{ color: 'var(--w-muted)' }}
              />
            ) : null}
          </article>
        ))}
      </div>
    </Shell>
  );
}
