'use client';

import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Section } from '@/types';
import { phoneHref, useSite, whatsappHref } from '../SectionContext';
import { EditableText } from '../Editable';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export function FooterSection({ section }: { section: Section }) {
  const ctx = useSite();
  const { editable, website } = ctx;
  const props = section.props as {
    brand: string;
    tagline: string;
    phone?: string;
    email?: string;
    address?: string;
    items: FooterColumn[];
    instagram?: string;
    facebook?: string;
    whatsappUrl?: string;
    copyright: string;
  };

  const showBadge = website.settings?.showWeboraBadge !== false;

  return (
    <footer className="border-t" style={{ borderColor: 'var(--w-border)', background: 'var(--w-surface-alt)' }}>
      <div className="site-wrap py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <EditableText
              sectionId={section.id}
              fieldKey="brand"
              value={props.brand}
              as="h3"
              className="text-[1.15rem] font-semibold"
            />
            <EditableText
              sectionId={section.id}
              fieldKey="tagline"
              value={props.tagline}
              as="p"
              multiline
              className="mt-2.5 max-w-sm text-[0.92rem] leading-relaxed"
              style={{ color: 'var(--w-muted)' }}
            />

            <div className="mt-5 flex flex-col gap-2.5 text-[0.9rem]" style={{ color: 'var(--w-muted)' }}>
              {props.phone ? (
                <a href={phoneHref(props.phone)} className="inline-flex items-center gap-2 hover:opacity-80">
                  <Phone className="h-4 w-4" /> {props.phone}
                </a>
              ) : null}
              {props.email ? (
                <a href={`mailto:${props.email}`} className="inline-flex items-center gap-2 hover:opacity-80">
                  <Mail className="h-4 w-4" /> {props.email}
                </a>
              ) : null}
              {props.address ? (
                <span className="inline-flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {props.address}
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex items-center gap-2">
              {props.instagram ? (
                <a
                  href={props.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full border transition hover:opacity-80"
                  style={{ borderColor: 'var(--w-border)' }}
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}
              {props.facebook ? (
                <a
                  href={props.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full border transition hover:opacity-80"
                  style={{ borderColor: 'var(--w-border)' }}
                >
                  <Facebook className="h-4 w-4" />
                </a>
              ) : null}
              {props.whatsappUrl ? (
                <a
                  href={whatsappHref(website.business?.whatsapp ?? website.business?.phone)}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="WhatsApp"
                  className="grid h-9 w-9 place-items-center rounded-full text-white transition hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          {(props.items ?? []).map((column, ci) => (
            <div key={`${column.title}-${ci}`}>
              <EditableText
                sectionId={section.id}
                fieldKey={`items.${ci}.title`}
                value={column.title}
                as="p"
                className="text-[0.78rem] font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'var(--w-muted)' }}
              />
              <ul className="mt-4 flex flex-col gap-2.5">
                {(column.links ?? []).map((link, li) => (
                  <li key={`${link.href}-${li}`}>
                    <a
                      href={editable ? undefined : ctx.resolveHref(link.href)}
                      onClick={(e) => editable && e.preventDefault()}
                      className="text-[0.92rem] transition hover:opacity-75"
                      style={{ color: 'var(--w-text)' }}
                    >
                      <EditableText sectionId={section.id} fieldKey={`items.${ci}.links.${li}.label`} value={link.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center" style={{ borderColor: 'var(--w-border)' }}>
          <EditableText
            sectionId={section.id}
            fieldKey="copyright"
            value={props.copyright}
            className="text-[0.82rem]"
            style={{ color: 'var(--w-muted)' }}
          />
          {showBadge ? (
            <p className="text-[0.78rem]" style={{ color: 'var(--w-muted)' }}>
              Built with{' '}
              <a href="/" className="font-semibold" style={{ color: 'var(--w-accent)' }} target="_blank" rel="noreferrer">
                WEBORA
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
