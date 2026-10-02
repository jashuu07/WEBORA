'use client';

import { Clock } from 'lucide-react';
import type { Section } from '@/types';
import { EditableText } from '../Editable';
import { Shell, SectionHead } from '../SectionShell';

/** Parses "10:00 AM – 9:00 PM", "9:00 AM – 10:00 PM", "Closed". */
function parseRange(hours: string): [number, number] | null {
  if (!hours || /closed/i.test(hours)) return null;
  const parts = hours.split(/[–—-]/).map((p) => p.trim());
  if (parts.length !== 2) return null;
  const toMinutes = (value: string) => {
    const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return null;
    let h = Number(match[1]);
    const m = Number(match[2] ?? 0);
    const mer = match[3]?.toLowerCase();
    if (mer === 'pm' && h !== 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return h * 60 + m;
  };
  const start = toMinutes(parts[0]);
  const end = toMinutes(parts[1]);
  if (start == null || end == null) return null;
  return [start, end];
}

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function isOpenNow(rows: { day: string; hours: string }[]): boolean | null {
  if (!rows.length) return null;
  const now = new Date();
  const today = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  for (const row of rows) {
    const day = row.day.toLowerCase();
    const match = day.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (!match) continue;
    // "Monday – Friday" style rows cover a span.
    const allDays = day.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/g) ?? [];
    const firstDay = allDays[0];
    if (!firstDay) continue;

    const covered = new Set<number>();
    if (allDays.length >= 2 && /[\u2013-]/.test(day)) {
      const from = DAY_INDEX[firstDay] ?? today;
      const to = DAY_INDEX[allDays[1] ?? firstDay] ?? from;
      for (let i = 0, cursor = from; i < 7; i++) {
        covered.add(cursor);
        if (cursor === to) break;
        cursor = (cursor + 1) % 7;
      }
    } else {
      covered.add(DAY_INDEX[firstDay] ?? today);
    }

    if (!covered.has(today)) continue;
    const parsed = parseRange(row.hours);
    if (!parsed) return false;
    return minutes >= parsed[0] && minutes <= parsed[1];
  }
  return null;
}

export function HoursSection({ section, alt = false }: { section: Section; alt?: boolean }) {
  const props = section.props as {
    eyebrow: string;
    heading: string;
    note?: string;
    showNow?: boolean;
    items: { day: string; hours: string }[];
    image?: string;
  };
  const rows = props.items ?? [];
  const openNow = props.showNow === false ? null : isOpenNow(rows);

  return (
    <Shell section={section} alt={alt}>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHead section={section} />

          {openNow !== null ? (
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5" style={{ borderColor: 'var(--w-border)' }}>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: openNow ? '#16A34A' : '#B6B1A8', boxShadow: openNow ? '0 0 0 4px rgba(22,163,74,.14)' : undefined }}
              />
              <span className="text-[0.85rem] font-semibold">{openNow ? 'Open now' : 'Closed right now'}</span>
              <span className="text-[0.8rem]" style={{ color: 'var(--w-muted)' }}>
                · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : null}

          {props.image ? (
            <div
              className="mt-8 overflow-hidden"
              style={{ borderRadius: 'calc(var(--w-radius) * 1.3)', aspectRatio: '16 / 10' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ) : null}
        </div>

        <div translate-="no">
          <ul className="site-card p-6" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {rows.map((row, index) => (
              <li key={index} className="flex items-baseline justify-between gap-4 pb-3" style={{ borderBottom: index === rows.length - 1 ? 'none' : '1px solid var(--w-border)' }}>
                <EditableText
                  sectionId={section.id}
                  fieldKey={`items.${index}.day`}
                  value={row.day}
                  as="span"
                  className="text-[0.95rem] font-medium"
                />
                <EditableText
                  sectionId={section.id}
                  fieldKey={`items.${index}.hours`}
                  value={row.hours}
                  as="span"
                  className="text-[0.92rem] tabular-nums"
                  style={{ color: /closed/i.test(row.hours) ? 'var(--w-muted)' : 'var(--w-text)' }}
                />
              </li>
            ))}
          </ul>

          {props.note ? (
            <p className="mt-4 flex items-start gap-2 text-[0.86rem]" style={{ color: 'var(--w-muted)' }}>
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <EditableText sectionId={section.id} fieldKey="note" value={props.note} multiline />
            </p>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
