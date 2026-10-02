'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Palette,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import type { DesignTokens, Page, Section, SectionType, StyleId, Website } from '@/types';
import { SECTION_DEFS, SECTION_LIST } from '@/lib/sections/schemas';
import { STYLE_LIST, getStyle } from '@/lib/design/styles';
import { Button } from '@/components/ui/Button';
import { Select, Switch, TextArea, TextInput } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { INDUSTRY_LABELS } from '@/lib/templates/catalog';

export type RailTab = 'pages' | 'sections' | 'add' | 'theme' | 'site';

const TABS: { id: RailTab; label: string; icon: typeof FileText }[] = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'site', label: 'Site', icon: Settings2 },
];

export function LeftRail({
  website,
  page,
  selectedSectionId,
  tab,
  onTab,
  onSelectPage,
  onSelectSection,
  onAddSection,
  onAddPage,
  onDeletePage,
  onPageChange,
  onSectionChange,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onTokens,
  onStyle,
  onSettings,
  onWebsite,
  onDeleteWebsite,
}: {
  website: Website;
  page: Page;
  selectedSectionId: string | null;
  tab: RailTab;
  onTab: (tab: RailTab) => void;
  onSelectPage: (pageId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onAddSection: (type: SectionType) => void;
  onAddPage: (input: { title: string; slug: string; inNav: boolean; preset: 'blank' | 'about' | 'services' | 'gallery' | 'contact' }) => Promise<void>;
  onDeletePage: (pageId: string) => Promise<void>;
  onPageChange: (mutate: (page: Page) => Page) => void;
  onSectionChange: (sectionId: string, mutate: (section: Section) => Section) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onDuplicateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onTokens: (patch: Partial<DesignTokens>) => void;
  onStyle: (styleId: StyleId) => void;
  onSettings: (patch: Record<string, unknown>) => void;
  onWebsite: (patch: Partial<Website>) => void;
  onDeleteWebsite: () => Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-0.5 border-b border-[var(--line)] px-2 py-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[0.68rem] font-medium transition-colors',
                active ? 'bg-[var(--accent-soft)] text-[#8a3b09]' : 'text-[var(--text-muted)] hover:bg-[#f6f5f2]',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'pages' ? (
          <PagesPanel
            website={website}
            page={page}
            onSelectPage={onSelectPage}
            onAddPage={onAddPage}
            onDeletePage={onDeletePage}
            onPageChange={onPageChange}
          />
        ) : null}

        {tab === 'sections' ? (
          <SectionsPanel
            page={page}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
            onSectionChange={onSectionChange}
            onMoveSection={onMoveSection}
            onDuplicateSection={onDuplicateSection}
            onDeleteSection={onDeleteSection}
            onAddClick={() => onTab('add')}
          />
        ) : null}

        {tab === 'add' ? <AddPanel onAdd={onAddSection} /> : null}

        {tab === 'theme' ? <ThemePanel website={website} onTokens={onTokens} onStyle={onStyle} /> : null}

        {tab === 'site' ? (
          <SitePanel
            website={website}
            onSettings={onSettings}
            onWebsite={onWebsite}
            onDeleteWebsite={onDeleteWebsite}
          />
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pages                                                                     */
/* -------------------------------------------------------------------------- */

function PagesPanel({
  website,
  page,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onPageChange,
}: {
  website: Website;
  page: Page;
  onSelectPage: (id: string) => void;
  onAddPage: (input: { title: string; slug: string; inNav: boolean; preset: 'blank' | 'about' | 'services' | 'gallery' | 'contact' }) => Promise<void>;
  onDeletePage: (id: string) => Promise<void>;
  onPageChange: (mutate: (page: Page) => Page) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ title: '', slug: '', preset: 'blank' as 'blank' | 'about' | 'services' | 'gallery' | 'contact' });

  return (
    <div>
      <p className="inspector-label">Pages</p>
      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        Add pages for services, pricing, gallery or anything else — they appear in your navigation automatically.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {website.pages.map((item) => {
          const active = item.id === page.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectPage(item.id)}
                className={cn('layer-row w-full', active && 'border-[#ffd9b9]')}
                data-active={active}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
                <span className="shrink-0 text-[0.68rem] text-[var(--text-muted)]">/{item.slug === 'home' ? '' : item.slug}</span>
                {!item.inNav ? <span title="Hidden from navigation"><EyeOff className="h-3 w-3 shrink-0 text-[var(--text-muted)]" /></span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex gap-1.5">
        <Button size="sm" variant="outline" className="flex-1" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAdding(true)}>
          Add page
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={page.slug === 'home'}
          onClick={() => onDeletePage(page.id)}
          icon={<Trash2 className="h-3.5 w-3.5" />}
        >
          Delete
        </Button>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <TextInput
          label="Page title"
          value={page.title}
          onChange={(e) => onPageChange((p) => ({ ...p, title: e.target.value }))}
        />
        <div className="mt-3">
          <Switch
            label="Show in navigation"
            checked={page.inNav}
            onChange={(next) => onPageChange((p) => ({ ...p, inNav: next }))}
          />
        </div>
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a page"
        description="Pick a starter preset — you can add, remove and reorder sections afterwards."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                if (!draft.title.trim()) return;
                setBusy(true);
                try {
                  await onAddPage({
                    title: draft.title.trim(),
                    slug: (draft.slug.trim() || draft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, ''),
                    inNav: true,
                    preset: draft.preset,
                  });
                  setAdding(false);
                  setDraft({ title: '', slug: '', preset: 'blank' });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Add page
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Page title"
            placeholder="Pricing"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <TextInput
            label="URL path"
            hint="auto-generated if empty"
            placeholder="pricing"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          />
          <Select
            label="Starter content"
            value={draft.preset}
            onChange={(e) => setDraft((d) => ({ ...d, preset: e.target.value as typeof draft.preset }))}
          >
            <option value="blank">Blank (one section)</option>
            <option value="about">About-style</option>
            <option value="services">Services + pricing + FAQ</option>
            <option value="gallery">Gallery</option>
            <option value="contact">Contact + hours + FAQ</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

function SectionsPanel({
  page,
  selectedSectionId,
  onSelectSection,
  onSectionChange,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onAddClick,
}: {
  page: Page;
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onSectionChange: (sectionId: string, mutate: (section: Section) => Section) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onDuplicateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div>
      <p className="inspector-label">Sections on “{page.title}”</p>
      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        Reorder, hide or remove any section. Navigation and footer stay pinned to the top and bottom.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {page.sections.map((section, index) => {
          const active = section.id === selectedSectionId;
          const locked = section.type === 'nav' || section.type === 'footer';
          return (
            <li key={section.id} className={cn('rounded-xl border p-1.5', active ? 'border-[#ffd9b9] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white')}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectSection(section.id)}
                  className="min-w-0 flex-1 px-1.5 py-1 text-left"
                >
                  <span className={cn('block truncate text-[0.82rem] font-medium', active ? 'text-[#8a3b09]' : 'text-[var(--text)]')}>
                    {section.label || section.type}
                  </span>
                  <span className="block truncate text-[0.68rem] text-[var(--text-muted)]">
                    {section.type}
                    {!section.visible ? ' · hidden' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Move up"
                  disabled={locked || index <= 1}
                  onClick={() => onMoveSection(section.id, -1)}
                  className="rounded p-1 text-[var(--text-muted)] transition hover:bg-white disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={locked || index >= page.sections.length - 2}
                  onClick={() => onMoveSection(section.id, 1)}
                  className="rounded p-1 text-[var(--text-muted)] transition hover:bg-white disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={section.visible ? 'Hide' : 'Show'}
                  onClick={() => onSectionChange(section.id, (s) => ({ ...s, visible: !s.visible }))}
                  className="rounded p-1 text-[var(--text-muted)] transition hover:bg-white"
                >
                  {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  aria-label="Duplicate"
                  disabled={locked}
                  onClick={() => onDuplicateSection(section.id)}
                  className="rounded p-1 text-[var(--text-muted)] transition hover:bg-white disabled:opacity-30"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  disabled={locked}
                  onClick={() => onDeleteSection(section.id)}
                  className="rounded p-1 text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Button variant="outline" size="sm" className="mt-3 w-full" icon={<Plus className="h-3.5 w-3.5" />} onClick={onAddClick}>
        Add a section
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Add sections                                                              */
/* -------------------------------------------------------------------------- */

const GROUPS = ['Core', 'Content', 'Convert', 'Contact'] as const;

function AddPanel({ onAdd }: { onAdd: (type: SectionType) => void }) {
  return (
    <div>
      <p className="inspector-label">Component library</p>
      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        Sections are inserted above your footer. Every one is fully editable and responsive.
      </p>

      {GROUPS.map((group) => (
        <div key={group} className="mt-4">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{group}</p>
          <div className="flex flex-col gap-1.5">
            {SECTION_LIST.filter((def) => def.libraryGroup === group).map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => onAdd(def.type)}
                className="group rounded-xl border border-[var(--line)] bg-white p-3 text-left transition hover:border-[var(--accent)] hover:shadow-[var(--shadow-xs)]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span className="text-[0.85rem] font-medium">{def.label}</span>
                </span>
                <span className="mt-1 block text-[0.74rem] leading-relaxed text-[var(--text-muted)]">{def.description}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Theme                                                                     */
/* -------------------------------------------------------------------------- */

function ThemePanel({
  website,
  onTokens,
  onStyle,
}: {
  website: Website;
  onTokens: (patch: Partial<DesignTokens>) => void;
  onStyle: (styleId: StyleId) => void;
}) {
  const tokens = website.tokens;
  const active = getStyle(website.styleId);

  return (
    <div>
      <p className="inspector-label">Style preset</p>
      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        Presets set colours, type pairing, corner radius and page rhythm together.
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {STYLE_LIST.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onStyle(style.id)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-2.5 text-left transition',
              style.id === website.styleId ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white hover:border-[var(--line-strong)]',
            )}
          >
            <span className="flex gap-1">
              {style.swatches.map((swatch) => (
                <span key={swatch} className="h-4 w-4 rounded-full border border-black/10" style={{ background: swatch }} />
              ))}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.82rem] font-medium">{style.name}</span>
              <span className="block truncate text-[0.7rem] text-[var(--text-muted)]">
                {style.tokens.headingFont === 'display' ? 'Serif headings' : 'Sans headings'} ·{' '}
                {style.tokens.mode === 'dark' ? 'Dark' : 'Light'}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-6 inspector-label">Custom colours</p>
      <div className="mt-3 flex flex-col gap-3">
        <ColorRow label="Accent" value={tokens.accent} onChange={(v) => onTokens({ accent: v })} />
        <ColorRow label="Accent tint" value={tokens.accentSoft} onChange={(v) => onTokens({ accentSoft: v })} />
        <ColorRow label="Page background" value={tokens.surface} onChange={(v) => onTokens({ surface: v })} />
        <ColorRow label="Alternate band" value={tokens.surfaceAlt} onChange={(v) => onTokens({ surfaceAlt: v })} />
        <ColorRow label="Body text" value={tokens.ink} onChange={(v) => onTokens({ ink: v })} />
        <ColorRow label="Muted text" value={tokens.muted} onChange={(v) => onTokens({ muted: v })} />
        <ColorRow label="Borders" value={tokens.border} onChange={(v) => onTokens({ border: v })} />
      </div>

      <p className="mt-6 inspector-label">Typography & shape</p>
      <div className="mt-3 flex flex-col gap-3">
        <Select
          label="Heading font"
          value={tokens.headingFont}
          onChange={(e) => onTokens({ headingFont: e.target.value as DesignTokens['headingFont'] })}
        >
          <option value="display">Editorial serif</option>
          <option value="sans">Modern sans</option>
          <option value="mono">Technical mono</option>
        </Select>
        <Select
          label="Corner radius"
          value={tokens.radius}
          onChange={(e) => onTokens({ radius: e.target.value as DesignTokens['radius'] })}
        >
          <option value="sharp">Sharp</option>
          <option value="soft">Soft</option>
          <option value="round">Round</option>
        </Select>
        <Select
          label="Page rhythm"
          value={tokens.density}
          onChange={(e) => onTokens({ density: e.target.value as DesignTokens['density'] })}
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="airy">Airy</option>
        </Select>
        <Select
          label="Base mode"
          value={tokens.mode}
          onChange={(e) => onTokens({ mode: e.target.value as DesignTokens['mode'] })}
        >
          <option value="light">Light sections</option>
          <option value="dark">Dark sections</option>
        </Select>
      </div>

      <p className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        {active.description}
      </p>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded-lg border border-[var(--line-strong)] bg-white p-1"
        aria-label={`${label} colour`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.78rem] font-medium">{label}</p>
        <p className="truncate text-[0.7rem] text-[var(--text-muted)]">{value}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Site settings                                                             */
/* -------------------------------------------------------------------------- */

function SitePanel({
  website,
  onSettings,
  onWebsite,
  onDeleteWebsite,
}: {
  website: Website;
  onSettings: (patch: Record<string, unknown>) => void;
  onWebsite: (patch: Partial<Website>) => void;
  onDeleteWebsite: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const settings = website.settings;

  return (
    <div>
      <p className="inspector-label">Website</p>
      <div className="mt-3 flex flex-col gap-3">
        <TextInput label="Website name" value={website.name} onChange={(e) => onWebsite({ name: e.target.value })} />
        <TextInput
          label="Web address"
          hint="webora.app/"
          value={website.slug}
          onChange={(e) => onWebsite({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
        />
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="text-[0.75rem] text-[var(--text-muted)]">Industry content library</p>
          <p className="mt-1 text-[0.85rem] font-medium">{INDUSTRY_LABELS[website.industry]}</p>
        </div>
      </div>

      <p className="mt-6 inspector-label">Branding</p>
      <div className="mt-3 flex flex-col gap-3">
        <TextInput
          label="Logo text"
          value={settings.logoText}
          onChange={(e) => onSettings({ logoText: e.target.value })}
        />
        <TextInput
          label="Logo image URL"
          hint="replaces the text logo"
          value={settings.logoUrl ?? ''}
          onChange={(e) => onSettings({ logoUrl: e.target.value })}
        />
        <Switch
          label="Show “Built with WEBORA” badge"
          description="Included on the Free plan. Turn it off on Starter and Pro."
          checked={settings.showWeboraBadge}
          onChange={(next) => onSettings({ showWeboraBadge: next })}
        />
      </div>

      <p className="mt-6 inspector-label">Customer actions</p>
      <div className="mt-1">
        <Switch
          label="Floating WhatsApp button"
          description="Shown on the home page when a WhatsApp number is set."
          checked={settings.whatsappFloat}
          onChange={(next) => onSettings({ whatsappFloat: next })}
        />
        <Switch
          label="Contact form"
          description="Enquiries are saved to your dashboard inbox."
          checked={settings.contactFormEnabled}
          onChange={(next) => onSettings({ contactFormEnabled: next })}
        />
        <Switch
          label="Google Map in contact section"
          checked={settings.mapEmbedEnabled}
          onChange={(next) => onSettings({ mapEmbedEnabled: next })}
        />
      </div>

      <p className="mt-6 inspector-label">Business details</p>
      <div className="mt-3 flex flex-col gap-3">
        <TextInput
          label="Phone"
          value={website.business.phone ?? ''}
          onChange={(e) => onWebsite({ business: { ...website.business, phone: e.target.value } })}
        />
        <TextInput
          label="WhatsApp"
          value={website.business.whatsapp ?? ''}
          onChange={(e) => onWebsite({ business: { ...website.business, whatsapp: e.target.value } })}
        />
        <TextInput
          label="Email"
          value={website.business.email ?? ''}
          onChange={(e) => onWebsite({ business: { ...website.business, email: e.target.value } })}
        />
        <TextArea
          label="Address"
          rows={2}
          value={website.business.address ?? ''}
          onChange={(e) => onWebsite({ business: { ...website.business, address: e.target.value } })}
        />
        <TextInput
          label="Instagram"
          value={website.business.social?.instagram ?? ''}
          onChange={(e) =>
            onWebsite({ business: { ...website.business, social: { ...website.business.social, instagram: e.target.value } } })
          }
        />
      </div>

      <p className="mt-6 inspector-label">How this was generated</p>
      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.76rem] leading-relaxed text-[var(--text-muted)]">
        <p>
          <strong className="font-semibold text-[var(--text)]">
            {website.generation.engine === 'ai-provider' ? `AI provider · ${website.generation.provider}` : 'Local engine'}
          </strong>
          {website.generation.model ? ` (${website.generation.model})` : ''}
        </p>
        <p className="mt-1">
          Template {website.templateId} ·{' '}
          {new Date(website.generation.generatedAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {website.generation.stages.length ? (
          <ul className="mt-2 flex flex-col gap-0.5">
            {website.generation.stages.map((stage) => (
              <li key={stage.id} className="flex justify-between gap-2">
                <span>{stage.label}</span>
                <span className="tabular-nums">{stage.ms} ms</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmDelete(true)}>
          Delete this website
        </Button>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${website.name}”?`}
        description="Pages, enquiries and analytics for this website are removed permanently."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onDeleteWebsite();
                } catch (error) {
                  toast({ title: 'Could not delete', description: (error as Error).message, tone: 'error' });
                } finally {
                  setBusy(false);
                  setConfirmDelete(false);
                }
              }}
            >
              Delete permanently
            </Button>
          </>
        }
      />
    </div>
  );
}

export { Sparkles, Type };
