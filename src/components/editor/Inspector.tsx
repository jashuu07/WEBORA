'use client';

import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import type { FieldDef, Page, Section, Website } from '@/types';
import { SECTION_DEFS } from '@/lib/sections/schemas';
import { Button } from '@/components/ui/Button';
import { Select, Switch, TextArea, TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getPath } from './editor-utils';
import { useStockLibrary } from './image-library';
import { cn } from '@/lib/utils';

/**
 * Right-hand inspector.
 *
 * Controls are generated from the section's field schema (lib/sections/schemas),
 * so every section type gets a correct editor without bespoke UI code — and any
 * new field added to the schema appears here automatically.
 */
export function Inspector({
  website,
  page,
  section,
  selectedField,
  onField,
  onProps,
  onSection,
  onDelete,
  onDuplicate,
  onMove,
  onAiRewrite,
  aiBusy,
  onPageChange,
  onAddSection,
}: {
  website: Website;
  page: Page;
  section: Section | null;
  selectedField: { sectionId: string; key: string } | null;
  onField: (key: string) => void;
  onProps: (path: string, value: unknown) => void;
  onSection: (mutate: (section: Section) => Section) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onAiRewrite: (instruction: string) => void;
  aiBusy: boolean;
  onPageChange: (mutate: (page: Page) => Page) => void;
  onAddSection: () => void;
}) {
  if (!section) {
    return (
      <PageSettings panel page={page} website={website} onPageChange={onPageChange} onAddSection={onAddSection} />
    );
  }

  const definition = SECTION_DEFS[section.type];
  const index = page.sections.findIndex((s) => s.id === section.id);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--line)] px-4 py-3.5">
        <p className="inspector-label">Selected section</p>
        <div className="mt-1.5 flex items-center gap-2">
          <h3 className="text-[0.95rem] font-semibold">{definition?.label ?? section.type}</h3>
          <span className="chip">{section.type}</span>
        </div>
        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-[var(--text-muted)]">{definition?.description}</p>

        <div className="mt-3 flex items-center gap-1">
          <IconAction label="Move up" onClick={() => onMove(-1)} disabled={index <= 1}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction label="Move down" onClick={() => onMove(1)} disabled={index >= page.sections.length - 2}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction
            label={section.visible ? 'Hide section' : 'Show section'}
            onClick={() => onSection((s) => ({ ...s, visible: !s.visible }))}
          >
            {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </IconAction>
          <IconAction label="Duplicate section" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction
            label="Delete section"
            onClick={onDelete}
            disabled={section.type === 'nav' || section.type === 'footer'}
            tone="danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <Section
          title="Content"
          description="Click any field — or edit directly on the page."
        >
          <div className="flex flex-col gap-4">
            {(definition?.fields ?? []).map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                section={section}
                highlighted={selectedField?.sectionId === section.id && selectedField.key === field.key}
                onFocus={() => onField(field.key)}
                onChange={(value) => onProps(field.key, value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Layout & spacing" description="Applies to this section only.">
          <div className="flex flex-col gap-3">
            <Select
              label="Vertical spacing"
              value={section.spacing.paddingY}
              onChange={(e) => onSection((s) => ({ ...s, spacing: { ...s.spacing, paddingY: e.target.value as Section['spacing']['paddingY'] } }))}
            >
              <option value="sm">Compact</option>
              <option value="md">Normal</option>
              <option value="lg">Roomy</option>
              <option value="xl">Extra roomy</option>
            </Select>
            <Select
              label="Side padding"
              value={section.spacing.paddingX}
              onChange={(e) => onSection((s) => ({ ...s, spacing: { ...s.spacing, paddingX: e.target.value as Section['spacing']['paddingX'] } }))}
            >
              <option value="sm">Narrow</option>
              <option value="md">Normal</option>
              <option value="lg">Wide</option>
            </Select>
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#33373f]">
                Content width · {section.spacing.width}px
              </label>
              <input
                type="range"
                min={880}
                max={1440}
                step={20}
                value={section.spacing.width}
                onChange={(e) => onSection((s) => ({ ...s, spacing: { ...s.spacing, width: Number(e.target.value) } }))}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </Section>

        <Section title="Rewrite with AI" description="Uses your business details — never invents facts.">
          <AiRewrite onRewrite={onAiRewrite} busy={aiBusy} sectionType={section.type} />
        </Section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field controls                                                            */
/* -------------------------------------------------------------------------- */

function FieldControl({
  field,
  section,
  highlighted,
  onFocus,
  onChange,
}: {
  field: FieldDef;
  section: Section;
  highlighted?: boolean;
  onFocus: () => void;
  onChange: (value: unknown) => void;
}) {
  const value = getPath(section.props, field.key);

  const wrapper = (children: React.ReactNode) => (
    <div
      className={cn('rounded-xl transition-all', highlighted && 'ring-2 ring-[rgba(242,106,27,.35)] ring-offset-2')}
      onFocus={onFocus}
    >
      {children}
    </div>
  );

  switch (field.kind) {
    case 'textarea':
      return wrapper(
        <TextArea
          label={field.label}
          rows={field.key === 'features' ? 5 : 3}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={field.help}
        />,
      );

    case 'number':
      return wrapper(
        <TextInput
          label={field.label}
          type="number"
          min={field.min}
          max={field.max}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          onFocus={onFocus}
        />,
      );

    case 'select':
      return wrapper(
        <Select label={field.label} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} onFocus={onFocus}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>,
      );

    case 'toggle':
      return wrapper(
        <Switch
          label={field.label}
          description={field.help}
          checked={Boolean(value)}
          onChange={(next) => onChange(next)}
        />,
      );

    case 'color':
      return wrapper(<ColorField label={field.label} value={String(value ?? '')} onChange={onChange} />);

    case 'image':
      return wrapper(<ImageField label={field.label} value={String(value ?? '')} onChange={onChange} onFocus={onFocus} />);

    case 'list':
      return wrapper(
        <ListEditor
          field={field}
          items={(Array.isArray(value) ? value : []) as Record<string, unknown>[]}
          onChange={onChange}
        />,
      );

    default:
      return wrapper(
        <TextInput
          label={field.label}
          hint={field.help}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
        />,
      );
  }
}

function ListEditor({
  field,
  items,
  onChange,
}: {
  field: FieldDef;
  items: Record<string, unknown>[];
  onChange: (value: unknown) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null);
  const itemFields = field.itemFields ?? [];

  const blank = () => Object.fromEntries(itemFields.map((f) => [f.key, f.kind === 'number' ? 5 : '']));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[0.82rem] font-semibold text-[#33373f]">{field.label}</p>
        <span className="text-[0.75rem] text-[var(--text-muted)]">{items.length} item{items.length === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {items.map((item, index) => {
          const summary = String(item[itemFields[0]?.key ?? 'name'] ?? item.name ?? item.title ?? `Item ${index + 1}`);
          const open = openIndex === index;
          return (
            <div key={index} className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="min-w-0 flex-1 truncate text-left text-[0.85rem] font-medium"
                >
                  {summary || `Item ${index + 1}`}
                </button>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...items];
                    const [moved] = next.splice(index, 1);
                    next.splice(index - 1, 0, moved);
                    onChange(next);
                    setOpenIndex(index - 1);
                  }}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[#f4f2ee] disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    const [moved] = next.splice(index, 1);
                    next.splice(index + 1, 0, moved);
                    onChange(next);
                    setOpenIndex(index + 1);
                  }}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[#f4f2ee] disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => {
                    onChange(items.filter((_, i) => i !== index));
                    setOpenIndex(null);
                  }}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {open ? (
                <div className="flex flex-col gap-3 border-t border-[var(--line)] bg-[var(--surface)] p-3">
                  {itemFields.map((sub) => (
                    <NestedField
                      key={sub.key}
                      field={sub}
                      value={item[sub.key]}
                      onChange={(nextValue) => {
                        const next = items.map((it, i) => (i === index ? { ...it, [sub.key]: nextValue } : it));
                        onChange(next);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-2.5 w-full"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => {
          onChange([...items, blank()]);
          setOpenIndex(items.length);
        }}
      >
        Add {field.label.toLowerCase().replace(/s$/, '')}
      </Button>
    </div>
  );
}

/** Nested lists (menu categories → items, footer columns → links). */
function NestedField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === 'list') {
    const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
    return <ListEditor field={field} items={items} onChange={onChange} />;
  }

  if (field.kind === 'textarea') {
    return (
      <TextArea
        label={field.label}
        rows={3}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.kind === 'select') {
    return (
      <Select label={field.label} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.kind === 'toggle') {
    return <Switch label={field.label} checked={Boolean(value)} onChange={onChange} />;
  }

  if (field.kind === 'image') {
    return <ImageField label={field.label} value={String(value ?? '')} onChange={onChange} />;
  }

  if (field.kind === 'number') {
    return (
      <TextInput
        label={field.label}
        type="number"
        min={field.min}
        max={field.max}
        value={String(value ?? '')}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  return (
    <TextInput
      label={field.label}
      hint={field.help}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#33373f]">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#f26a1b'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-lg border border-[var(--line-strong)] bg-white p-1"
          aria-label={`${label} colour picker`}
        />
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="#f26a1b" />
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}) {
  const { toast } = useToast();
  const library = useStockLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/assets', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Upload failed.');
      onChange(json.data.asset.url);
      toast({ title: 'Image uploaded', tone: 'success' });
    } catch (error) {
      toast({ title: 'Upload failed', description: (error as Error).message, tone: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#33373f]">{label}</label>

      <div className="overflow-hidden rounded-xl border border-[var(--line)]">
        <div className="relative h-28 bg-[var(--surface)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-[0.8rem] text-[var(--text-muted)]">No image set</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] p-2">
          <Button size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()} icon={<ImagePlus className="h-3.5 w-3.5" />}>
            Upload
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setLibraryOpen((v) => !v)}>
            {libraryOpen ? 'Hide library' : 'Sample library'}
          </Button>
          {value ? (
            <Button size="sm" variant="ghost" onClick={() => onChange('')} icon={<X className="h-3.5 w-3.5" />}>
              Clear
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </div>

        {libraryOpen ? (
          <div className="grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto border-t border-[var(--line)] bg-[var(--surface)] p-2">
            {library.length === 0 ? (
              <p className="col-span-3 p-2 text-[0.78rem] leading-relaxed text-[var(--text-muted)]">
                No sample images are available. Upload your own photo, or paste an image URL below.
              </p>
            ) : null}
            {library.map((image) => (
              <button
                key={image.url}
                type="button"
                title={image.label}
                onClick={() => {
                  onChange(image.url);
                  setLibraryOpen(false);
                }}
                className="overflow-hidden rounded-lg border border-transparent transition hover:border-[var(--accent)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.label} className="h-16 w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <input
        className="input mt-2 text-[0.82rem]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Or paste an image URL"
      />
    </div>
  );
}

function AiRewrite({
  onRewrite,
  busy,
  sectionType,
}: {
  onRewrite: (instruction: string) => void;
  busy: boolean;
  sectionType: string;
}) {
  const [instruction, setInstruction] = useState('');

  return (
    <div>
      <TextInput
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={`e.g. make the ${sectionType} copy warmer`}
        leading={<Wand2 className="h-3.5 w-3.5" />}
      />
      <Button
        className="mt-2.5 w-full"
        variant="ink"
        loading={busy}
        icon={<Sparkles className="h-3.5 w-3.5" />}
        onClick={() => {
          onRewrite(instruction);
          setInstruction('');
        }}
      >
        Rewrite this section
      </Button>
      <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        Without an AI provider configured, WEBORA’s local engine rewrites using your industry library. The toast tells you
        which engine responded.
      </p>
    </div>
  );
}

function PageSettings({
  page,
  website,
  onPageChange,
  onAddSection,
  panel,
}: {
  page: Page;
  website: Website;
  onPageChange: (mutate: (page: Page) => Page) => void;
  onAddSection: () => void;
  panel?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--line)] px-4 py-3.5">
        <p className="inspector-label">{panel ? 'Page settings' : 'Nothing selected'}</p>
        <h3 className="mt-1.5 text-[0.95rem] font-semibold">{page.title}</h3>
        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-[var(--text-muted)]">
          Select a section on the canvas to edit its content, or manage this page below.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <Section title="Page">
          <div className="flex flex-col gap-3">
            <TextInput
              label="Page title"
              value={page.title}
              onChange={(e) => onPageChange((p) => ({ ...p, title: e.target.value }))}
            />
            <TextInput
              label="URL path"
              hint={`/s/${website.slug}/`}
              value={page.slug}
              disabled={page.slug === 'home'}
              onChange={(e) =>
                onPageChange((p) => ({
                  ...p,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                }))
              }
            />
            <Switch
              label="Show in navigation"
              checked={page.inNav}
              onChange={(next) => onPageChange((p) => ({ ...p, inNav: next }))}
            />
          </div>
        </Section>

        <Section title="SEO" description="Generated for you — refine the wording if you like.">
          <div className="flex flex-col gap-3">
            <TextInput
              label="Meta title"
              hint={`${page.seo.title.length}/60`}
              value={page.seo.title}
              onChange={(e) => onPageChange((p) => ({ ...p, seo: { ...p.seo, title: e.target.value } }))}
            />
            <TextArea
              label="Meta description"
              hint={`${page.seo.description.length}/160`}
              rows={3}
              value={page.seo.description}
              onChange={(e) => onPageChange((p) => ({ ...p, seo: { ...p.seo, description: e.target.value } }))}
            />
            <TextInput
              label="Keywords"
              hint="comma separated"
              value={page.seo.keywords.join(', ')}
              onChange={(e) =>
                onPageChange((p) => ({
                  ...p,
                  seo: { ...p.seo, keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) },
                }))
              }
            />
            <SeoPreview title={page.seo.title} description={page.seo.description} slug={`${website.slug}/${page.slug === 'home' ? '' : page.slug}`} />
          </div>
        </Section>

        <Section title="Sections on this page">
          <ul className="flex flex-col gap-1.5">
            {page.sections.map((section) => (
              <li key={section.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-[0.82rem]">
                <span className="font-medium">{section.label || section.type}</span>
                <span className={cn('text-[0.72rem]', section.visible ? 'text-emerald-600' : 'text-[var(--text-muted)]')}>
                  {section.visible ? 'Visible' : 'Hidden'}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-3 w-full" icon={<Plus className="h-3.5 w-3.5" />} onClick={onAddSection}>
            Add a section
          </Button>
        </Section>
      </div>
    </div>
  );
}

function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        Search result preview
      </p>
      <p className="mt-2 text-[0.78rem] text-emerald-700">yourdomain.com/s/{slug}</p>
      <p className="mt-0.5 text-[0.92rem] font-medium text-[#1a0dab]">{title || 'Page title'}</p>
      <p className="mt-0.5 line-clamp-2 text-[0.82rem] leading-relaxed text-[var(--text-muted)]">
        {description || 'Meta description'}
      </p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 border-b border-[var(--line)] pb-6 last:border-0 last:pb-0">
      <h4 className="text-[0.82rem] font-semibold text-[var(--text)]">{title}</h4>
      {description ? <p className="mt-1 mb-3 text-[0.76rem] leading-relaxed text-[var(--text-muted)]">{description}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  tone = 'default',
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] transition disabled:opacity-35',
        tone === 'danger'
          ? 'text-[var(--text-muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600'
          : 'text-[var(--text-muted)] hover:bg-[#f6f5f2] hover:text-[var(--text)]',
      )}
    >
      {children}
    </button>
  );
}

export { Loader2 };
