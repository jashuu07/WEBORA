'use client';

import { ArrowRight, MessageCircle } from 'lucide-react';
import type { Section } from '@/types';
import { EditableText } from '../Editable';
import { Shell } from '../SectionShell';
import { useSite, whatsappHref } from '../SectionContext';

export function CtaSection({ section }: { section: Section }) {
  const ctx = useSite();
  const { editable, website } = ctx;
  const props = section.props as {
    heading: string;
    sub: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    variant?: 'solid' | 'dark' | 'soft';
  };

  const variant = props.variant ?? 'solid';
  const whatsapp = website.business?.whatsapp ?? website.business?.phone;

  const surface =
    variant === 'solid'
      ? { background: 'var(--w-accent)', color: '#fff', border: 'transparent' }
      : variant === 'dark'
        ? { background: 'var(--w-ink)', color: '#fff', border: 'transparent' }
        : { background: 'var(--w-accent-soft)', color: 'var(--w-text)', border: 'transparent' };

  const mutedColor = variant === 'soft' ? 'var(--w-muted)' : 'rgba(255,255,255,.76)';

  return (
    <Shell section={section}>
      <div
        className="relative overflow-hidden px-7 py-11 text-center sm:px-14 sm:py-14"
        style={{ ...surface, borderRadius: 'calc(var(--w-radius) * 1.6)' }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{ background: variant === 'soft' ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.24)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <EditableText
            sectionId={section.id}
            fieldKey="heading"
            value={props.heading}
            as="h2"
            className="text-[clamp(1.6rem,3vw,2.35rem)] font-semibold leading-tight tracking-[-0.02em]"
          />
          <EditableText
            sectionId={section.id}
            fieldKey="sub"
            value={props.sub}
            as="p"
            multiline
            className="mt-3.5 text-[1.02rem] leading-relaxed"
            style={{ color: mutedColor }}
          />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={editable ? undefined : ctx.resolveHref(props.primaryHref || '/contact')}
              onClick={(e) => editable && e.preventDefault()}
              className="site-btn"
              style={
                variant === 'soft'
                  ? { background: 'var(--w-ink)', color: '#fff' }
                  : { background: '#fff', color: '#14161a' }
              }
            >
              <EditableText sectionId={section.id} fieldKey="primaryLabel" value={props.primaryLabel} />
              <ArrowRight className="h-4 w-4" />
            </a>

            {props.secondaryLabel ? (
              <a
                href={editable ? undefined : ctx.resolveHref(props.secondaryHref || '/services')}
                onClick={(e) => editable && e.preventDefault()}
                className="site-btn"
                style={{
                  background: 'transparent',
                  color: variant === 'soft' ? 'var(--w-text)' : '#fff',
                  border: `1px solid ${variant === 'soft' ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.36)'}`,
                }}
              >
                <EditableText sectionId={section.id} fieldKey="secondaryLabel" value={props.secondaryLabel} />
              </a>
            ) : null}

            {whatsapp && !editable ? (
              <a
                href={whatsappHref(whatsapp, `Hi ${website.business?.name}, I would like to know more.`)}
                target="_blank"
                rel="noreferrer noopener"
                className="site-btn"
                style={{
                  background: 'transparent',
                  color: variant === 'soft' ? 'var(--w-text)' : '#fff',
                  border: `1px solid ${variant === 'soft' ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.36)'}`,
                }}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Shell>
  );
}
