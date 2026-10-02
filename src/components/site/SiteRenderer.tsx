'use client';

import { useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Copy, EyeOff, MessageCircle, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { Page, Section, SectionType, Website } from '@/types';
import { cn } from '@/lib/utils';
import { tokensToCssVars } from '@/lib/design/styles';
import { SiteProvider, whatsappHref, type SectionAction, type SiteCtxValue } from './SectionContext';
import { NavSection } from './sections/NavSection';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { MenuSection } from './sections/MenuSection';
import { GallerySection } from './sections/GallerySection';
import { PricingSection } from './sections/PricingSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { HoursSection } from './sections/HoursSection';
import { TeamSection } from './sections/TeamSection';
import { StatsSection } from './sections/StatsSection';
import { FaqSection } from './sections/FaqSection';
import { CtaSection } from './sections/CtaSection';
import { ContactSection } from './sections/ContactSection';
import { FooterSection } from './sections/FooterSection';

/** Section types that look better without an alternating band behind them. */
const NEVER_ALT: SectionType[] = ['nav', 'hero', 'stats', 'cta', 'footer'];

export interface SiteRendererProps {
  website: Website;
  page: Page;
  /** Editor affordances: hover outlines, click-to-select, inline editing. */
  editable?: boolean;
  selectedSectionId?: string | null;
  hoveredSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onHoverSection?: (sectionId: string | null) => void;
  onSelectField?: (sectionId: string, key: string) => void;
  onText?: (sectionId: string, path: string, value: string) => void;
  className?: string;
  /** Renders the floating WhatsApp button (public view only). */
  showFloatingActions?: boolean;
  deviceOverride?: 'desktop' | 'tablet' | 'mobile';
  /** Sections that changed since the last render — they pulse once. */
  flashIds?: string[];
  /** Editor only: contextual toolbar actions for the selected section. */
  onSectionAction?: (action: SectionAction, sectionId: string) => void;
}

export function SiteRenderer({
  website,
  page,
  editable = false,
  selectedSectionId,
  hoveredSectionId,
  onSelectSection,
  onHoverSection,
  onSelectField,
  onText,
  className,
  showFloatingActions = false,
  flashIds,
  onSectionAction,
}: SiteRendererProps) {
  const sitePrefix = `/s/${website.slug}`;

  const resolveHref = useCallback(
    (href: string) => {
      if (!href) return '#';
      if (editable) return '#';
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
      if (href === '/') return sitePrefix;
      const [path, hash] = href.split('#');
      const slug = path.replace(/^\//, '');
      const matched = website.pages.find((p) => p.slug === slug);
      const target = matched ? (matched.slug === 'home' ? sitePrefix : `${sitePrefix}/${matched.slug}`) : `${sitePrefix}/${slug}`;
      return hash ? `${target}#${hash}` : target;
    },
    [editable, sitePrefix, website.pages],
  );

  const handleText = useCallback(
    (sectionId: string, key: string, value: string) => {
      onText?.(sectionId, key, value);
    },
    [onText],
  );

  const ctx: SiteCtxValue = useMemo(
    () => ({
      website,
      page,
      editable,
      resolveHref,
      onText: handleText,
      onSelectSection,
      onSelectField,
      onSectionAction,
      formatMoney: (value: string) => value,
    }),
    [website, page, editable, resolveHref, handleText, onSelectSection, onSelectField, onSectionAction],
  );

  const visibleSections = page.sections.filter((s) => s.visible);
  let altCounter = 0;

  const whatsapp = website.business?.whatsapp ?? website.business?.phone;

  return (
    <SiteProvider value={ctx}>
      <div
        className={cn('site-root min-h-full', className)}
        style={tokensToCssVars(website.tokens)}
        onClick={editable ? () => onSelectSection?.('') : undefined}
      >
        {visibleSections.map((section: Section) => {
          const isAltCandidate = !NEVER_ALT.includes(section.type);
          if (isAltCandidate) altCounter += 1;
          const alt = isAltCandidate && altCounter % 2 === 0;

          const inner = renderSection(section, alt);
          const flash = flashIds?.includes(section.id);
          const selected = selectedSectionId === section.id;

          if (!editable) return <div key={section.id} className={flash ? 'section-flash' : undefined}>{inner}</div>;

          return (
            <div
              key={section.id}
              className="section-outline"
              data-selected={selected ? 'true' : 'false'}
              data-hover={hoveredSectionId === section.id ? 'true' : 'false'}
              onMouseEnter={() => onHoverSection?.(section.id)}
              onMouseLeave={() => onHoverSection?.(null)}
            >
              {/* The frame that steps forward when the section is selected. */}
              <div className={cn('section-frame relative', flash && 'section-flash')}>
                {inner}
              </div>

              {selected && onSectionAction ? (
                <div className="absolute right-2.5 top-2.5 z-40">
                  <span className="section-toolbar" onMouseEnter={(event) => event.stopPropagation()}>
                    <ToolButton label="Move up" onClick={() => onSectionAction('up', section.id)}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </ToolButton>
                    <ToolButton label="Move down" onClick={() => onSectionAction('down', section.id)}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </ToolButton>
                    <ToolButton label="Duplicate section" onClick={() => onSectionAction('duplicate', section.id)}>
                      <Copy className="h-3.5 w-3.5" />
                    </ToolButton>
                    <ToolButton label="Hide from site" onClick={() => onSectionAction('hide', section.id)}>
                      <EyeOff className="h-3.5 w-3.5" />
                    </ToolButton>
                    <ToolButton label="Edit settings" onClick={() => onSectionAction('settings', section.id)}>
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                    </ToolButton>
                    <ToolButton label="Delete section" danger onClick={() => onSectionAction('delete', section.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </ToolButton>
                  </span>
                </div>
              ) : (
                <span className="section-badge">{section.label || section.type}</span>
              )}
            </div>
          );
        })}

        {showFloatingActions && whatsapp && website.settings?.whatsappFloat !== false && page.slug === 'home' ? (
          <a
            href={whatsappHref(whatsapp, `Hi ${website.business?.name}, I found you online and have a question.`)}
            target="_blank"
            rel="noreferrer noopener"
            className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 text-[0.9rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,.5)] transition hover:scale-[1.03]"
            style={{ background: '#25D366' }}
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        ) : null}
      </div>
    </SiteProvider>
  );
}

function renderSection(section: Section, alt: boolean) {
  switch (section.type) {
    case 'nav':
      return <NavSection section={section} />;
    case 'hero':
      return <HeroSection section={section} />;
    case 'about':
      return <AboutSection section={section} alt={alt} />;
    case 'services':
      return <ServicesSection section={section} alt={alt} />;
    case 'menu':
      return <MenuSection section={section} alt={alt} />;
    case 'gallery':
      return <GallerySection section={section} alt={alt} />;
    case 'pricing':
      return <PricingSection section={section} alt={alt} />;
    case 'testimonials':
      return <TestimonialsSection section={section} alt={alt} />;
    case 'hours':
      return <HoursSection section={section} alt={alt} />;
    case 'team':
      return <TeamSection section={section} alt={alt} />;
    case 'stats':
      return <StatsSection section={section} />;
    case 'faq':
      return <FaqSection section={section} alt={alt} />;
    case 'cta':
      return <CtaSection section={section} />;
    case 'contact':
      return <ContactSection section={section} alt={alt} />;
    case 'footer':
      return <FooterSection section={section} />;
    default:
      return null;
  }
}

function ToolButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      data-danger={danger ? 'true' : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {children}
    </button>
  );
}
