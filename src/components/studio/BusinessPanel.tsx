'use client';

import { useMemo, useState } from 'react';
import { MapPin, Phone, Plus, X } from 'lucide-react';
import type { BusinessHours, BusinessProfile, IndustryId } from '@/types';
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { detectIndustry, getPack } from '@/lib/industry/packs';
import { INDUSTRY_LABELS } from '@/lib/templates/catalog';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  { label: 'Bakery', text: 'I own a bakery in Hyderabad. We sell cakes, pastries and coffee, and take custom celebration cake orders.' },
  { label: 'Salon', text: 'A boutique salon in Bengaluru offering haircuts, ammonia-free colour, facials and bridal packages.' },
  { label: 'Restaurant', text: 'Family-run restaurant famous for Hyderabadi dum biryani and charcoal kebabs. Private dining available.' },
  { label: 'Gym', text: 'Strength and conditioning gym in Pune with certified coaches, group classes and a free trial session.' },
];

/**
 * Left column of the /create workspace: everything WEBORA needs to know.
 *
 * The panel owns no submit button — the CTA lives in the controls column so the
 * owner can see the preview react to every keystroke while they fill it in.
 */
export function BusinessPanel({
  value,
  onChange,
  className,
}: {
  value: BusinessProfile;
  onChange: (next: BusinessProfile) => void;
  className?: string;
}) {
  const [serviceDraft, setServiceDraft] = useState('');
  const [showMore, setShowMore] = useState(false);

  const detection = useMemo(
    () => detectIndustry([value.description, value.type, ...(value.services ?? [])].join(' ')),
    [value.description, value.type, value.services],
  );
  const pack = getPack(detection.matched.length ? detection.industry : value.industry);

  function set<K extends keyof BusinessProfile>(key: K, next: BusinessProfile[K]) {
    onChange({ ...value, [key]: next });
  }

  function addService() {
    const name = serviceDraft.trim();
    if (!name || value.services.includes(name)) return;
    set('services', [...value.services, name].slice(0, 12));
    setServiceDraft('');
  }

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Business name"
          required
          placeholder="The Bakery House"
          value={value.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <TextInput
          label="Business type"
          hint="optional"
          placeholder="Bakery & café"
          value={value.type}
          onChange={(e) => set('type', e.target.value)}
        />
      </div>

      <TextArea
        label="Describe your business"
        required
        rows={5}
        placeholder="I own a bakery in Hyderabad. We sell cakes, pastries and coffee…"
        value={value.description}
        onChange={(e) => set('description', e.target.value)}
        hint="plain language is perfect — the preview builds itself from this"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.78rem] font-medium text-[var(--text-muted)]">Try an example:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => {
              const guess = detectIndustry(example.text);
              const cityMatch = example.text.match(/in ([A-Z][a-z]+)/);
              onChange({
                ...value,
                description: example.text,
                industry: guess.industry,
                city: value.city || (cityMatch?.[1] ?? ''),
              });
            }}
            className="chip transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {example.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="City / area"
          placeholder="Hyderabad"
          leading={<MapPin className="h-4 w-4" />}
          value={value.city}
          onChange={(e) => set('city', e.target.value)}
        />
        <Select
          label="Industry content library"
          value={value.industry}
          onChange={(e) => set('industry', e.target.value as IndustryId)}
          hint={
            detection.matched.length && detection.industry !== value.industry
              ? `detected: ${INDUSTRY_LABELS[detection.industry]}`
              : undefined
          }
        >
          {(Object.keys(INDUSTRY_LABELS) as IndustryId[]).map((id) => (
            <option key={id} value={id}>
              {INDUSTRY_LABELS[id]}
            </option>
          ))}
        </Select>
      </div>

      <Field label="Services or products" hint="press Enter to add — these become your service cards">
        <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--line-strong)] bg-white p-2.5">
          {value.services.map((service) => (
            <span key={service} className="chip chip-accent">
              {service}
              <button
                type="button"
                onClick={() => set('services', value.services.filter((s) => s !== service))}
                aria-label={`Remove ${service}`}
                className="rounded-full p-0.5 transition hover:bg-white/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
            <input
              value={serviceDraft}
              onChange={(e) => setServiceDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addService();
                }
                if (e.key === 'Backspace' && !serviceDraft && value.services.length) {
                  set('services', value.services.slice(0, -1));
                }
              }}
              placeholder={value.services.length ? 'Add another…' : 'e.g. Custom cakes'}
              className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[0.92rem] outline-none"
            />
            <button
              type="button"
              onClick={addService}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[#f4f2ee] hover:text-[var(--text)]"
              aria-label="Add service"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          label="Phone"
          placeholder="+91 98490 12345"
          leading={<Phone className="h-4 w-4" />}
          value={value.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
        />
        <TextInput
          label="WhatsApp"
          hint="optional"
          placeholder="+91 98490 12345"
          value={value.whatsapp ?? ''}
          onChange={(e) => set('whatsapp', e.target.value)}
        />
        <TextInput
          label="Email"
          hint="optional"
          placeholder="hello@bakery.in"
          value={value.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="self-start text-[0.85rem] font-semibold text-[var(--accent)] hover:underline"
      >
        {showMore ? 'Hide address, hours and social links' : 'Add address, hours and social links'}
      </button>

      {showMore ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-white p-4">
          <TextArea
            label="Address"
            rows={2}
            placeholder="Plot 42, Road No. 12, Banjara Hills, Hyderabad"
            value={value.address ?? ''}
            onChange={(e) => set('address', e.target.value)}
          />

          <HoursEditor hours={value.hours ?? []} onChange={(hours) => set('hours', hours)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Instagram URL"
              placeholder="https://instagram.com/…"
              value={value.social?.instagram ?? ''}
              onChange={(e) => set('social', { ...(value.social ?? {}), instagram: e.target.value })}
            />
            <TextInput
              label="Facebook URL"
              placeholder="https://facebook.com/…"
              value={value.social?.facebook ?? ''}
              onChange={(e) => set('social', { ...(value.social ?? {}), facebook: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      {/* What the engine has understood so far — always visible, never guessed. */}
      <div className="rounded-2xl border border-[#ffdcc0] bg-[var(--accent-soft)] p-4">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#8a3b09]">What WEBORA understood</p>
        <div className="mt-3 flex flex-col gap-2 text-[0.84rem] text-[#8a3b09]">
          <Row label="Business" value={value.name || '—'} />
          <Row label="Industry" value={`${pack.emoji} ${INDUSTRY_LABELS[value.industry]}`} />
          <Row label="Location" value={value.city || 'your city'} />
          <Row label="Services" value={value.services.length ? `${value.services.length} added` : 'from the library'} />
          <Row
            label="Signals"
            value={detection.matched.length ? detection.matched.slice(0, 3).join(', ') : 'no strong signals yet'}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#ffdcc0] pb-2 last:border-0 last:pb-0">
      <span className="opacity-70">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function HoursEditor({ hours, onChange }: { hours: BusinessHours[]; onChange: (next: BusinessHours[]) => void }) {
  const [draft, setDraft] = useState({ day: '', hours: '' });

  return (
    <div>
      <p className="text-[0.82rem] font-semibold text-[#33373f]">Business hours</p>
      <p className="mt-1 text-[0.78rem] text-[var(--text-muted)]">
        Leave empty to use typical hours for your industry — editable later in the editor.
      </p>

      {hours.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {hours.map((row, index) => (
            <li key={index} className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-[0.85rem]">
              <span className="font-medium">{row.day}</span>
              <span className="text-[var(--text-muted)]">{row.hours}</span>
              <button
                type="button"
                onClick={() => onChange(hours.filter((_, i) => i !== index))}
                className="ml-auto rounded p-1 text-[var(--text-muted)] hover:bg-[#f4f2ee]"
                aria-label={`Remove ${row.day}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="input max-w-[170px]"
          placeholder="Monday – Friday"
          value={draft.day}
          onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))}
        />
        <input
          className="input max-w-[170px]"
          placeholder="9:00 AM – 8:00 PM"
          value={draft.hours}
          onChange={(e) => setDraft((d) => ({ ...d, hours: e.target.value }))}
        />
        <Button
          variant="outline"
          onClick={() => {
            if (!draft.day || !draft.hours) return;
            onChange([...hours, draft]);
            setDraft({ day: '', hours: '' });
          }}
        >
          Add hours
        </Button>
      </div>
    </div>
  );
}
