'use client';

import { createContext, useContext } from 'react';
import type { Page, Section, Website } from '@/types';

/** Actions offered by the editor's contextual section toolbar. */
export type SectionAction = 'up' | 'down' | 'duplicate' | 'hide' | 'delete' | 'settings';

export interface SiteCtxValue {
  website: Website;
  page: Page;
  /** Editor mode adds hover/selection affordances and inline text editing. */
  editable: boolean;
  /** Map a stored href ("/about") to the address the visitor should hit. */
  resolveHref: (href: string) => string;
  onText: (sectionId: string, key: string, value: string) => void;
  onSelectSection?: (sectionId: string) => void;
  onSelectField?: (sectionId: string, key: string) => void;
  onEditList?: (sectionId: string, key: string, index: number, field: string, value: unknown) => void;
  /** Editor only: the toolbar that rides with the selected section. */
  onSectionAction?: (action: SectionAction, sectionId: string) => void;
  formatMoney: (value: string) => string;
}

const SiteCtx = createContext<SiteCtxValue | null>(null);

export function SiteProvider({ value, children }: { value: SiteCtxValue; children: React.ReactNode }) {
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite(): SiteCtxValue {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error('Site sections must be rendered inside <SiteProvider>');
  return ctx;
}

export function phoneHref(phone?: string) {
  if (!phone) return '#';
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappHref(number?: string, message?: string) {
  if (!number) return '#';
  const digits = number.replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function mapsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function sectionInnerProps(section: Section, editable: boolean, onSelect?: () => void, selected?: boolean) {
  return {
    'data-section-id': section.id,
    'data-hover': undefined as unknown as string,
    'data-selected': selected ? 'true' : 'false',
    onClick: editable
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onSelect?.();
        }
      : undefined,
  };
}
