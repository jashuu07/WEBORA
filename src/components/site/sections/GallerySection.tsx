'use client';

import { ImagePlus } from 'lucide-react';
import type { Section } from '@/types';
import { useSite } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

interface GalleryItem {
  image?: string;
  caption?: string;
}

export function GallerySection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const { editable, onSelectField } = useSite();
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    layout?: 'grid' | 'mosaic' | 'strip';
    items: GalleryItem[];
  };

  const items = props.items ?? [];
  const layout = props.layout ?? 'grid';

  const gridClass =
    layout === 'strip'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
      : layout === 'mosaic'
        ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
        : 'grid grid-cols-2 gap-4 lg:grid-cols-3';

  return (
    <Shell section={section} alt={alt}>
      <SectionHead section={section} />

      <div className={`mt-11 ${gridClass}`}>
        {items.map((item, index) => {
          const feature = layout === 'mosaic' && index === 0;
          return (
            <figure
              key={index}
              className={`group relative overflow-hidden ${feature ? 'col-span-2 row-span-2 sm:col-span-2' : ''}`}
              style={{
                borderRadius: 'calc(var(--w-radius) * 1.1)',
                aspectRatio: layout === 'strip' ? '1 / 1' : feature ? '1 / 1' : '4 / 3',
                background: 'var(--w-surface-alt)',
                border: '1px solid var(--w-border)',
              }}
            >
              {item.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.caption ?? ''}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                  />
                  <figcaption
                    className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-black/62 to-transparent px-4 pb-3 pt-8 text-[0.82rem] font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <EditableText sectionId={section.id} fieldKey={`items.${index}.caption`} value={item.caption ?? ''} />
                  </figcaption>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectField?.(section.id, `items.${index}.image`)}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-center transition hover:bg-black/[0.03]"
                  aria-label={`Add image ${index + 1}`}
                >
                  <ImagePlus className="h-5 w-5" style={{ color: 'var(--w-muted)' }} />
                  <span className="text-[0.78rem] font-medium" style={{ color: 'var(--w-muted)' }}>
                    {editable ? 'Add photo' : item.caption}
                  </span>
                </button>
              )}
            </figure>
          );
        })}
      </div>

      {editable ? (
        <p className="mt-4 text-[0.75rem]" style={{ color: 'var(--w-muted)' }}>
          These are sample images from the WEBORA library — click a tile to swap in your own photos.
        </p>
      ) : null}
    </Shell>
  );
}
