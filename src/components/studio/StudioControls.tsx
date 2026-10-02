'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CircleDashed, ExternalLink, Loader2, Pencil, RefreshCw, Rocket, Sparkles } from 'lucide-react';
import type { StyleId, Website } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/primitives';
import { STYLE_LIST, getStyle } from '@/lib/design/styles';
import { cn } from '@/lib/utils';
import type { ResponsiveAudit } from '@/services/ai';

export interface StageState {
  id: string;
  label: string;
  detail: string;
  ms?: number;
}

export function ControlCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface p-4', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[0.86rem] font-semibold tracking-[-0.01em]">{title}</h2>
      </div>
      {hint ? <p className="mt-1 text-[0.76rem] leading-relaxed text-[var(--text-muted)]">{hint}</p> : null}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

/** Style presets as compact swatch rows — the only place 3D is not used, on purpose. */
export function StylePicker({ value, onChange }: { value: StyleId; onChange: (next: StyleId) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {STYLE_LIST.map((style) => {
        const active = style.id === value;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition',
              active
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-[var(--line)] bg-white hover:border-[var(--line-strong)]',
            )}
          >
            <span className="flex shrink-0 overflow-hidden rounded-md border border-black/10">
              {style.swatches.slice(0, 4).map((swatch) => (
                <span key={swatch} className="h-6 w-3" style={{ background: swatch }} />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8rem] font-semibold leading-tight">{style.name}</span>
              <span className="block truncate text-[0.72rem] text-[var(--text-muted)]">
                {style.bestFor.slice(0, 3).join(', ')}
              </span>
            </span>
            {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function TemplatePicker({
  templates,
  value,
  onSelect,
}: {
  templates: { id: string; name: string; industry: string; styleId: StyleId }[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {templates.map((template) => {
        const active = template.id === value;
        const style = getStyle(template.styleId);
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition',
              active
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-[var(--line)] bg-white hover:border-[var(--line-strong)]',
            )}
          >
            <span className="h-6 w-9 shrink-0 rounded-md border border-black/10" style={{ background: style.tokens.accent }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8rem] font-semibold leading-tight">{template.name}</span>
              <span className="block text-[0.72rem] text-[var(--text-muted)]">
                {style.name} · {template.industry}
              </span>
            </span>
            {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Six real pipeline stages, shown while the request is in flight. */
export function StageStrip({
  stages,
  activeIndex,
  done,
}: {
  stages: StageState[];
  activeIndex: number;
  done: boolean;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {stages.map((stage, index) => {
        const complete = done || index < activeIndex;
        const running = !done && index === activeIndex;
        return (
          <li key={stage.id} className="inline-flex items-center gap-2">
            {complete ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
            ) : (
              <CircleDashed className="h-3.5 w-3.5 text-[#cfcac1]" />
            )}
            <span
              className={cn(
                'text-[0.78rem] transition-colors',
                complete ? 'text-[var(--text-muted)]' : running ? 'font-medium text-[var(--text)]' : 'text-[var(--text-muted)]',
              )}
            >
              {stage.label}
            </span>
            {stage.ms !== undefined && done ? (
              <span className="text-[0.7rem] tabular-nums text-[var(--text-muted)]">{stage.ms} ms</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** What exists once generation finishes: the site, its checks, and the next moves. */
export function ResultPanel({
  website,
  audit,
  engineLabel,
  engineDetail,
  detected,
  onRegenerate,
  regenerating,
  onPublish,
  publishing,
  liveUrl,
}: {
  website: Website;
  audit: ResponsiveAudit;
  engineLabel: string;
  engineDetail: string;
  detected: { industry: string; confidence: number; matched: string[] };
  onRegenerate: () => void;
  regenerating: boolean;
  onPublish: () => void;
  publishing: boolean;
  liveUrl: string | null;
}) {
  const [checksOpen, setChecksOpen] = useState(false);
  const pages = website.pages.length;
  const sections = website.pages.reduce((total, page) => total + page.sections.length, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
        <p className="inline-flex items-center gap-2 text-[0.84rem] font-semibold text-emerald-800">
          <Check className="h-4 w-4" strokeWidth={3} /> Website generated
        </p>
        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-emerald-800/85">
          {pages} pages · {sections} sections · {website.styleId} · responsive score {audit.score}/100
        </p>
        {detected.matched.length ? (
          <p className="mt-1 text-[0.74rem] text-emerald-800/75">
            Matched on {detected.matched.slice(0, 3).join(', ')}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {liveUrl ? (
          <>
            <ButtonLink href={liveUrl} target="_blank" icon={<ExternalLink className="h-4 w-4" />}>
              Open your live website
            </ButtonLink>
            <CopyButton value={liveUrl} label="Copy website address" className="w-full justify-center" />
          </>
        ) : (
          <Button icon={<Rocket className="h-4 w-4" />} loading={publishing} onClick={onPublish}>
            Publish website
          </Button>
        )}
        <ButtonLink href={`/editor/${website.id}`} variant="outline" icon={<Pencil className="h-4 w-4" />}>
          Open the editor
        </ButtonLink>
        <Button
          variant="ghost"
          loading={regenerating}
          onClick={onRegenerate}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Generate a fresh version
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setChecksOpen((v) => !v)}
        className="self-start text-[0.78rem] font-semibold text-[var(--accent)] hover:underline"
      >
        {checksOpen ? 'Hide the checks' : `See the ${audit.checks.length} checks WEBORA ran`}
      </button>

      {checksOpen ? (
        <ul className="flex flex-col gap-1.5">
          {audit.checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-[0.78rem]">
              {check.passed ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
              ) : (
                <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              )}
              <span className={check.passed ? 'text-[var(--text-muted)]' : 'text-amber-800'}>
                {check.label}
                {check.note ? <span className="text-[var(--text-muted)]"> — {check.note}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
        <p className="text-[0.76rem] font-semibold">Engine: {engineLabel}</p>
        <p className="mt-1 text-[0.74rem] leading-relaxed text-[var(--text-muted)]">{engineDetail}</p>
      </div>

      <p className="text-[0.74rem] leading-relaxed text-[var(--text-muted)]">
        Your site is saved as a draft. Nothing is public until you publish it — and you can keep editing after
        publishing too.
      </p>

      <Link href="/dashboard" className="text-[0.78rem] font-medium text-[var(--text-muted)] hover:text-[var(--text)]">
        Back to my websites
      </Link>
    </div>
  );
}

/** The primary action, with the reason it is unavailable stated plainly. */
export function GenerateButton({
  disabledReason,
  generating,
  onClick,
  engineLabel,
}: {
  disabledReason: string | null;
  generating: boolean;
  onClick: () => void;
  engineLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        loading={generating}
        disabled={Boolean(disabledReason) || generating}
        onClick={onClick}
        icon={<Sparkles className="h-4 w-4" />}
      >
        {generating ? 'Generating…' : 'Generate website'}
      </Button>
      <p className="text-[0.74rem] leading-relaxed text-[var(--text-muted)]">
        {disabledReason ?? `Runs the full pipeline with ${engineLabel}. Takes about a second.`}
      </p>
    </div>
  );
}
