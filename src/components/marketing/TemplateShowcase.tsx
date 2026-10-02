'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { IndustryId } from '@/types';
import { TEMPLATES, INDUSTRY_LABELS } from '@/lib/templates/catalog';
import { getStyle } from '@/lib/design/styles';
import { cn } from '@/lib/utils';

const FILTERS: { id: IndustryId | 'all'; label: string }[] = [
  { id: 'all', label: 'All templates' },
  ...(Object.keys(INDUSTRY_LABELS) as IndustryId[])
    .filter((id) => id !== 'general')
    .map((id) => ({ id, label: INDUSTRY_LABELS[id] })),
];

/**
 * Template gallery. Cards are rendered from the template blueprint (style
 * tokens + hero imagery), so what a visitor picks is what they get.
 */
export function TemplateShowcase({ limit, showFilters = true }: { limit?: number; showFilters?: boolean }) {
  const [filter, setFilter] = useState<IndustryId | 'all'>('all');

  const templates = useMemo(() => {
    const list = filter === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.industry === filter);
    return limit ? list.slice(0, limit) : list;
  }, [filter, limit]);

  return (
    <div>
      {showFilters ? (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-[0.84rem] font-medium transition',
                filter === item.id
                  ? 'border-[var(--surface-ink)] bg-[var(--surface-ink)] text-white'
                  : 'border-[var(--line)] bg-white text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', showFilters && 'mt-8')}>
        {templates.map((template) => {
          const style = getStyle(template.styleId);
          return (
            <article key={template.id} className="card-3d group relative">
              <div
                className="card-3d-inner relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]"
                style={{ perspective: 1200 }}
              >
                <div className="relative h-[248px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={template.image}
                    alt={`${template.name} template preview`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, rgba(10,10,12,.18) 0%, rgba(10,10,12,.05) 40%, rgba(10,10,12,.86) 100%)`,
                    }}
                  />

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-7 w-7 place-items-center rounded-lg text-[0.8rem] font-bold text-white"
                        style={{ background: style.tokens.accent }}
                      >
                        {template.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-[0.95rem] font-semibold leading-tight text-white">{template.name}</p>
                        <p className="text-[0.74rem] text-white/70">{template.tagline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-4 top-4 flex gap-1">
                    {style.swatches.slice(0, 3).map((swatch) => (
                      <span key={swatch} className="h-4 w-4 rounded-full border border-white/60" style={{ background: swatch }} />
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[0.88rem] leading-relaxed text-[var(--text-muted)]">{template.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {template.highlights.slice(0, 3).map((highlight) => (
                      <span key={highlight} className="chip">
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                    <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--text-muted)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                      {style.name}
                    </span>
                    <Link
                      href={`/signup?template=${template.id}`}
                      className="inline-flex items-center gap-1 text-[0.85rem] font-semibold text-[var(--accent)] hover:gap-2 transition-all"
                    >
                      Use template
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
