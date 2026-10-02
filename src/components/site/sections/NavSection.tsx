'use client';

import { useState } from 'react';
import { Menu, Phone, X } from 'lucide-react';
import type { Section } from '@/types';
import { useSite, phoneHref } from '../SectionContext';
import { EditableText } from '../Editable';

interface NavLink {
  label: string;
  href: string;
}

export function NavSection({ section }: { section: Section }) {
  const ctx = useSite();
  const { editable, onText } = ctx;
  const [open, setOpen] = useState(false);

  const props = section.props as {
    brand: string;
    logoUrl?: string;
    items: NavLink[];
    ctaLabel: string;
    ctaHref: string;
    showPhone?: boolean;
    phone?: string;
  };

  const links = props.items ?? [];

  return (
    <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'var(--w-border)', background: 'color-mix(in srgb, var(--w-surface) 88%, transparent)', backdropFilter: 'blur(12px)' }}>
      <div className="site-wrap flex h-[68px] items-center justify-between gap-4">
        <a
          href={editable ? undefined : ctx.resolveHref('/')}
          onClick={(e) => editable && e.preventDefault()}
          className="flex items-center gap-2.5"
        >
          {props.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt={props.brand} className="h-9 w-auto object-contain" />
          ) : (
            <span
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[0.95rem] font-bold text-white"
              style={{ background: 'var(--w-accent)' }}
            >
              {(props.brand ?? 'W').trim().charAt(0).toUpperCase()}
            </span>
          )}
          <EditableText
            sectionId={section.id}
            fieldKey="brand"
            value={props.brand}
            className="text-[1.02rem] font-semibold tracking-[-0.01em]"
          />
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link, index) => (
            <a
              key={`${link.href}-${index}`}
              href={editable ? undefined : ctx.resolveHref(link.href)}
              onClick={(e) => editable && e.preventDefault()}
              className="rounded-lg px-3 py-2 text-[0.9rem] font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--w-text)_6%,transparent)]"
              style={{ color: 'var(--w-muted)' }}
            >
              <EditableText
                sectionId={section.id}
                fieldKey={`items.${index}.label`}
                value={link.label}
                className="hover:text-[var(--w-text)]"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {props.showPhone && props.phone && !editable ? (
            <a href={phoneHref(props.phone)} className="hidden items-center gap-1.5 text-[0.86rem] font-medium lg:flex" style={{ color: 'var(--w-muted)' }}>
              <Phone className="h-3.5 w-3.5" />
              {props.phone}
            </a>
          ) : null}

          <a
            href={editable ? undefined : ctx.resolveHref(props.ctaHref || '/contact')}
            onClick={(e) => editable && e.preventDefault()}
            className="site-btn site-btn-primary hidden md:inline-flex"
            style={{ minHeight: 40, padding: '0 1.05rem', fontSize: '0.88rem' }}
          >
            <EditableText sectionId={section.id} fieldKey="ctaLabel" value={props.ctaLabel} />
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border md:hidden"
            style={{ borderColor: 'var(--w-border)' }}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t md:hidden" style={{ borderColor: 'var(--w-border)' }}>
          <div className="site-wrap flex flex-col gap-1 py-3">
            {links.map((link, index) => (
              <a
                key={`${link.href}-${index}-m`}
                href={editable ? undefined : ctx.resolveHref(link.href)}
                onClick={(e) => {
                  if (editable) e.preventDefault();
                  else setOpen(false);
                }}
                className="rounded-lg px-3 py-2.5 text-[0.95rem] font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href={editable ? undefined : ctx.resolveHref(props.ctaHref || '/contact')}
              onClick={(e) => {
                if (editable) e.preventDefault();
                else setOpen(false);
              }}
              className="site-btn site-btn-primary mt-2"
            >
              {props.ctaLabel}
            </a>
            {props.phone ? (
              <a href={phoneHref(props.phone)} className="site-btn site-btn-secondary mt-1">
                <Phone className="h-4 w-4" /> {props.phone}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
