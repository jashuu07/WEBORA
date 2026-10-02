'use client';

import { ArrowRight, Star } from 'lucide-react';
import type { Section } from '@/types';
import { useSite, whatsappHref } from '../SectionContext';
import { EditableText } from '../Editable';

/**
 * Hero — three layouts sharing one prop schema:
 *   split    → copy left, image right
 *   overlay  → full-bleed image with copy over it
 *   centered → centred copy with a wide image underneath
 */
export function HeroSection({ section }: { section: Section }) {
  const ctx = useSite();
  const { editable, website } = ctx;

  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    image?: string;
    layout?: 'split' | 'overlay' | 'centered';
    trustLine?: string;
  };

  const layout = props.layout ?? 'split';
  const whatsapp = website.business?.whatsapp ?? website.business?.phone;

  const copy = (
    <div className={layout === 'centered' ? 'mx-auto max-w-3xl text-center' : 'max-w-xl'}>
      {props.eyebrow ? (
        <p className="site-eyebrow mb-4 flex items-center gap-2" style={{ justifyContent: layout === 'centered' ? 'center' : 'flex-start' }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--w-accent)' }} />
          <EditableText sectionId={section.id} fieldKey="eyebrow" value={props.eyebrow} />
        </p>
      ) : null}

      <EditableText
        sectionId={section.id}
        fieldKey="heading"
        value={props.heading}
        as="h1"
        multiline
        className="text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
        style={layout === 'overlay' ? { color: '#fff' } : undefined}
      />

      <EditableText
        sectionId={section.id}
        fieldKey="sub"
        value={props.sub}
        as="p"
        multiline
        className="mt-5 text-[1.06rem] leading-[1.7]"
        style={{ color: layout === 'overlay' ? 'rgba(255,255,255,.8)' : 'var(--w-muted)' }}
      />

      <div
        className={`mt-8 flex flex-wrap items-center gap-3 ${layout === 'centered' ? 'justify-center' : ''}`}
      >
        <a
          href={editable ? undefined : ctx.resolveHref(props.primaryHref || '/contact')}
          onClick={(e) => editable && e.preventDefault()}
          className="site-btn site-btn-primary"
        >
          <EditableText sectionId={section.id} fieldKey="primaryLabel" value={props.primaryLabel} />
          <ArrowRight className="h-4 w-4" />
        </a>

        {props.secondaryLabel ? (
          <a
            href={editable ? undefined : ctx.resolveHref(props.secondaryHref || '/services')}
            onClick={(e) => editable && e.preventDefault()}
            className="site-btn site-btn-secondary"
            style={layout === 'overlay' ? { color: '#fff', borderColor: 'rgba(255,255,255,.4)' } : undefined}
          >
            <EditableText sectionId={section.id} fieldKey="secondaryLabel" value={props.secondaryLabel} />
          </a>
        ) : null}

        {whatsapp && !editable ? (
          <a
            href={whatsappHref(whatsapp, `Hi ${website.business?.name}, I found you online.`)}
            target="_blank"
            rel="noreferrer noopener"
            className="site-btn site-btn-secondary"
            style={layout === 'overlay' ? { color: '#fff', borderColor: 'rgba(255,255,255,.4)' } : undefined}
          >
            WhatsApp
          </a>
        ) : null}
      </div>

      {props.trustLine ? (
        <p
          className="mt-6 flex items-center gap-2 text-[0.88rem] font-medium"
          style={{ color: layout === 'overlay' ? 'rgba(255,255,255,.75)' : 'var(--w-muted)', justifyContent: layout === 'centered' ? 'center' : 'flex-start' }}
        >
          <Star className="h-4 w-4" style={{ color: 'var(--w-accent)' }} fill="currentColor" />
          {props.trustLine}
        </p>
      ) : null}
    </div>
  );

  if (layout === 'overlay') {
    return (
      <section
        data-section-id={section.id}
        onClick={editable ? (e) => { e.stopPropagation(); ctx.onSelectSection?.(section.id); } : undefined}
        className="relative isolate overflow-hidden"
        style={{ paddingTop: 'calc(6rem * var(--w-rhythm))', paddingBottom: 'calc(6rem * var(--w-rhythm))' }}
      >
        {props.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : null}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(100deg, rgba(10,10,12,.88) 12%, rgba(10,10,12,.62) 48%, rgba(10,10,12,.28) 100%)' }}
        />
        <div className="site-wrap max-w-2xl">{copy}</div>
      </section>
    );
  }

  return (
    <section
      data-section-id={section.id}
      onClick={editable ? (e) => { e.stopPropagation(); ctx.onSelectSection?.(section.id); } : undefined}
      className="relative overflow-hidden"
      style={{ paddingTop: 'calc(4.5rem * var(--w-rhythm))', paddingBottom: 'calc(5rem * var(--w-rhythm))' }}
    >
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.5] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--w-accent-soft), transparent 68%)' }}
      />
      <div className="site-wrap relative">
        <div className={layout === 'centered' ? '' : 'grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]'}>
          {copy}

          {props.image ? (
            <div className={layout === 'centered' ? 'mt-12' : ''}>
              <div
                className="relative overflow-hidden"
                style={{
                  borderRadius: 'calc(var(--w-radius) * 1.6)',
                  boxShadow: '0 24px 60px -34px rgba(0,0,0,.5)',
                  aspectRatio: layout === 'centered' ? '16 / 8' : '4 / 3.35',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={props.image} alt="" className="h-full w-full object-cover" loading="eager" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
