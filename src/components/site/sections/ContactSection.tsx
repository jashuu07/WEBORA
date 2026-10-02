'use client';

import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Section } from '@/types';
import { phoneHref, useSite, whatsappHref } from '../SectionContext';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';
import { ContactForm } from '../ContactForm';

export function ContactSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const { editable, website } = useSite();
  const props = section.props as {
    eyebrow: string;
    heading: string;
    sub?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    showForm?: boolean;
    formTitle?: string;
    mapEmbed?: boolean;
    mapQuery?: string;
    responseNote?: string;
  };

  const hasForm = props.showForm !== false && website.settings?.contactFormEnabled !== false;
  const details = [
    props.phone
      ? { icon: Phone, label: 'Phone', value: props.phone, href: phoneHref(props.phone) }
      : null,
    props.whatsapp
      ? { icon: MessageCircle, label: 'WhatsApp', value: props.whatsapp, href: whatsappHref(props.whatsapp, `Hi ${website.business?.name}!`) }
      : null,
    props.email ? { icon: Mail, label: 'Email', value: props.email, href: `mailto:${props.email}` } : null,
    props.address
      ? {
          icon: MapPin,
          label: 'Visit us',
          value: props.address,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.mapQuery || props.address)}`,
        }
      : null,
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];

  return (
    <Shell section={section} alt={alt}>
      <div className={`grid gap-12 ${hasForm ? 'lg:grid-cols-[1fr_.95fr] lg:gap-16' : ''}`}>
        <div>
          <SectionHead section={section} />

          <div className="mt-9 flex flex-col gap-5">
            {details.map((detail) => {
              const Icon = detail.icon;
              return (
                <a
                  key={detail.label}
                  href={editable ? undefined : detail.href}
                  target={detail.label === 'Visit us' || detail.label === 'WhatsApp' ? '_blank' : undefined}
                  rel="noreferrer noopener"
                  onClick={(e) => editable && e.preventDefault()}
                  className="flex items-start gap-4"
                >
                  <span
                    className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[calc(var(--w-radius)*.8)]"
                    style={{ background: 'var(--w-accent-soft)', color: 'var(--w-accent)' }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[0.74rem] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--w-muted)' }}>
                      {detail.label}
                    </span>
                    <span className="mt-1 block text-[1rem] font-medium">{detail.value}</span>
                  </span>
                </a>
              );
            })}
          </div>

          {props.responseNote ? (
            <EditableText
              sectionId={section.id}
              fieldKey="responseNote"
              value={props.responseNote}
              as="p"
              className="mt-7 text-[0.86rem]"
              style={{ color: 'var(--w-muted)' }}
            />
          ) : null}

          {props.mapEmbed !== false && (props.mapQuery || props.address) ? (
            <div
              className="mt-8 overflow-hidden"
              style={{ borderRadius: 'calc(var(--w-radius) * 1.1)', border: '1px solid var(--w-border)' }}
            >
              {editable ? (
                <div className="grid h-[220px] place-items-center text-center" style={{ background: 'var(--w-surface-alt)' }}>
                  <div>
                    <MapPin className="mx-auto mb-2 h-5 w-5" style={{ color: 'var(--w-accent)' }} />
                    <p className="text-[0.85rem] font-medium">Google Map preview</p>
                    <p className="mt-1 text-[0.78rem]" style={{ color: 'var(--w-muted)' }}>
                      Shown on your live site — “{props.mapQuery || props.address}”
                    </p>
                  </div>
                </div>
              ) : (
                <iframe
                  title={`Map to ${website.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(props.mapQuery || props.address || website.name)}&output=embed`}
                  className="h-[260px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          ) : null}
        </div>

        {hasForm ? (
          <div>
            <ContactForm slug={website.slug} editorMode={editable} title={props.formTitle ?? 'Send an enquiry'} />
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
