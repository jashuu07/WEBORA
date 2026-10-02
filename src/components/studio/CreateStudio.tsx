'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Info, Radio, Sparkles } from 'lucide-react';
import type { BusinessProfile, IndustryId, StyleId, Website } from '@/types';
import { BusinessPanel } from './BusinessPanel';
import { DeviceSwitch, type Device } from './DeviceSwitch';
import { StudioPreview } from './StudioPreview';
import { GenerationFlow } from './GenerationFlow';
import { ControlCard, GenerateButton, ResultPanel, StageStrip, StylePicker, TemplatePicker, type StageState } from './StudioControls';
import { useStagePacer } from './studio-motion';
import { ButtonLink } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/Toast';
import { getTemplate, recommendTemplates, INDUSTRY_LABELS } from '@/lib/templates/catalog';
import { STYLE_LIST } from '@/lib/design/styles';
import type { ResponsiveAudit } from '@/services/ai';
import { cn } from '@/lib/utils';

/** The six real pipeline stages, in order. */
const STAGES: StageState[] = [
  { id: 'understand', label: 'Understanding business', detail: 'Reading your description, services and location' },
  { id: 'layout', label: 'Planning website', detail: 'Matching your industry to a template and section order' },
  { id: 'design', label: 'Creating layout', detail: 'Applying colours, type scale and spacing' },
  { id: 'copy', label: 'Writing content', detail: 'Headlines, service descriptions, reviews and FAQs' },
  { id: 'mobile', label: 'Optimising mobile', detail: 'Checking responsive layout and tap targets' },
  { id: 'prepare', label: 'Website ready', detail: 'Assembling pages, navigation and SEO' },
];

type Draft = { website: Website; industry: IndustryId; packLabel: string };

/**
 * The /create workspace: business information on the left, a live 3D preview in
 * the centre, AI controls on the right.
 *
 * Two different kinds of preview live here, and the UI never blurs them:
 *
 *   • the live draft — rebuilt locally from the industry library as you type,
 *     labelled “not saved”, changed sections pulse when they update;
 *   • the generated website — the real pipeline result, saved to your account,
 *     publishing-ready.
 */
export function CreateStudio({
  defaultName,
  defaultTemplate,
  engine,
  starters,
}: {
  defaultName: string;
  defaultTemplate?: string;
  engine: { engine: string; label: string; detail: string };
  starters: Website[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  const initialTemplate = getTemplate(defaultTemplate);

  const [profile, setProfile] = useState<BusinessProfile>({
    name: defaultName,
    type: '',
    industry: 'general',
    description: '',
    city: '',
    country: 'India',
    services: [],
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    currency: 'INR',
    tone: 'warm',
    tags: [],
  });
  const [styleId, setStyleId] = useState<StyleId>(initialTemplate.styleId);
  const [templateId, setTemplateId] = useState<string>(initialTemplate.id);
  const [device, setDevice] = useState<Device>('desktop');

  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftState, setDraftState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const previousDraft = useRef<Website | null>(null);

  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useStagePacer(STAGES.length, generating, 240);
  const [result, setResult] = useState<{
    website: Website;
    audit: ResponsiveAudit;
    engineLabel: string;
    engineDetail: string;
    detected: { industry: string; confidence: number; matched: string[] };
  } | null>(null);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const detectedIndustry = (draft?.industry ?? profile.industry) as IndustryId;
  const starter = useMemo(
    () => starters.find((site) => site.industry === detectedIndustry) ?? starters[0],
    [starters, detectedIndustry],
  );

  const previewWebsite = result?.website ?? draft?.website ?? starter;
  const templates = useMemo(() => recommendTemplates(detectedIndustry, styleId).slice(0, 4), [detectedIndustry, styleId]);

  /* ---------------------------------------------------------------- live draft */

  const descriptionReady = profile.description.trim().length >= 15;
  const nameReady = profile.name.trim().length > 0;

  useEffect(() => {
    // Never fight the real generation.
    if (generating) return;
    if (!nameReady && !descriptionReady) {
      setDraft(null);
      setDraftState('idle');
      return;
    }

    setDraftState('loading');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            description: profile.description,
            city: profile.city,
            services: profile.services,
            industry: profile.industry,
            styleId,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'Preview unavailable.');

        if (!json.data.ready) {
          setDraft(null);
          setDraftState('idle');
          return;
        }

        const next = json.data.website as Website;
        setFlashIds(diffSectionIds(previousDraft.current, next));
        previousDraft.current = next;
        setDraft({ website: next, industry: json.data.industry as IndustryId, packLabel: json.data.packLabel });
        setDraftState('ready');
      } catch {
        setDraftState('error');
      }
    }, 850);

    return () => clearTimeout(timer);
  }, [
    profile.name,
    profile.description,
    profile.city,
    profile.services,
    profile.industry,
    styleId,
    generating,
    nameReady,
    descriptionReady,
  ]);

  // Clear the changed-section pulse shortly after it has played.
  useEffect(() => {
    if (!flashIds.length) return;
    const timer = setTimeout(() => setFlashIds([]), 1100);
    return () => clearTimeout(timer);
  }, [flashIds]);

  /* ---------------------------------------------------------------- generation */

  const generate = useCallback(async () => {
    setGenerating(true);
    setError('');
    setStage(0);
    const startedAt = Date.now();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ business: profile, styleId, templateId, businessTypeHint: profile.type }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Generation failed.');

      // The pipeline is fast (about a second locally). Space the reveal enough to
      // be readable, then show the measured timings — never longer than that.
      const minimum = STAGES.length * 240;
      const elapsed = Date.now() - startedAt;
      if (elapsed < minimum) await new Promise((resolve) => setTimeout(resolve, minimum - elapsed));

      setStage(STAGES.length - 1);
      setResult({
        website: json.data.website,
        audit: json.data.audit,
        engineLabel:
          json.data.engine.engine === 'ai-provider'
            ? `AI provider · ${json.data.engine.provider}`
            : 'WEBORA local engine (no AI provider connected)',
        engineDetail:
          json.data.engine.engine === 'ai-provider'
            ? 'Your copy was written by the connected AI provider, then styled by the WEBORA design engine.'
            : engine.detail,
        detected: json.data.detectedIndustry,
      });
      setDraftState('ready');
      toast({
        title: 'Website generated',
        description: 'Saved to your account as a draft. Publish when you are ready.',
        tone: 'success',
      });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      toast({ title: 'Generation failed', description: (err as Error).message, tone: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [profile, styleId, templateId, engine.detail, setStage, toast, router]);

  const publish = useCallback(async () => {
    if (!result) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/sites/${result.website.id}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not publish.');
      setLiveUrl(json.data.url);
      toast({ title: 'Your website is live', description: `Published to ${json.data.url}`, tone: 'success' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Publishing failed', description: (err as Error).message, tone: 'error' });
    } finally {
      setPublishing(false);
    }
  }, [result, toast, router]);

  const disabledReason = !nameReady
    ? 'Add your business name to continue.'
    : !descriptionReady
      ? 'Describe your business in a sentence or two — at least 15 characters.'
      : null;

  /* ------------------------------------------------------------------- render */

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(251,250,248,.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1520px] items-center gap-3 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[var(--text-muted)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[0.86rem] font-medium">Dashboard</span>
          </Link>

          <span className="ml-2 hidden items-center gap-2 text-[0.86rem] font-semibold sm:flex">
            Website studio
            <span className="chip">AI Business Website Studio</span>
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="chip">
              <Sparkles className="h-3.5 w-3.5" />
              {engine.engine === 'ai-provider' ? engine.label : 'Local engine'}
            </span>
            {result ? (
              <ButtonLink href={`/editor/${result.website.id}`} size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Open editor
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1520px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,368px)_minmax(0,1fr)_minmax(300px,340px)]">
          {/* ── centre on mobile, left on desktop ── */}
          <section className="order-2 xl:order-1">
            <div className="surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="eyebrow">01 · Business information</p>
                  <h2 className="mt-1.5 font-display text-[1.3rem] font-semibold tracking-[-0.02em]">
                    Tell us about the business
                  </h2>
                </div>
              </div>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-[var(--text-muted)]">
                The preview rebuilds as you type. Nothing is saved until you generate.
              </p>

              <div className="mt-5">
                <BusinessPanel value={profile} onChange={setProfile} />
              </div>
            </div>
          </section>

          {/* ── the workspace ── */}
          <section className="order-1 xl:order-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold',
                    result
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : draftState === 'ready'
                        ? 'border-[#ffdcc0] bg-[var(--accent-soft)] text-[#8a3b09]'
                        : 'border-[var(--line)] bg-white text-[var(--text-muted)]',
                  )}
                >
                  <Radio className="h-3 w-3" />
                  {generating
                    ? 'Assembling…'
                    : result
                      ? 'Generated website'
                      : draftState === 'ready'
                        ? 'Live draft · not saved'
                        : 'Example website'}
                </span>
                {draftState === 'loading' && !generating ? (
                  <span className="text-[0.74rem] text-[var(--text-muted)]">updating…</span>
                ) : null}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <DeviceSwitch device={device} onDevice={setDevice} />
              </div>
            </div>

            <div className="relative mt-3">
              {previewWebsite ? (
                <StudioPreview
                  website={previewWebsite}
                  device={device}
                  assembling={generating}
                  caption={STAGES[Math.min(stage, STAGES.length - 1)].label}
                  flashIds={generating ? [] : flashIds}
                  status={
                    <span className="glass pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.72rem] font-medium text-[var(--text-muted)]">
                      <Info className="h-3.5 w-3.5" />
                      {result
                        ? 'This is your saved draft — open the editor to change anything.'
                        : 'Draft preview. Generating saves the full website with every page and its SEO.'}
                    </span>
                  }
                  className="h-[440px] sm:h-[560px] xl:h-[640px]"
                />
              ) : (
                <div className="surface grid h-[440px] place-items-center p-8 sm:h-[560px] xl:h-[640px]">
                  <p className="max-w-sm text-center text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
                    Add a business name and a sentence about the business — the preview appears here.
                  </p>
                </div>
              )}
            </div>

            {generating || result ? (
              <div className="surface mt-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[0.8rem] font-semibold">
                    {generating ? 'Building your website' : 'Generation complete'}
                  </p>
                  <span className="text-[0.74rem] text-[var(--text-muted)]">
                    {generating
                      ? `Stage ${Math.min(stage + 1, STAGES.length)} of ${STAGES.length}`
                      : `Engine · ${result?.engineLabel}`}
                  </span>
                </div>
                <div className="mt-3">
                  <StageStrip
                    stages={STAGES.map((item) => ({
                      ...item,
                      ms: result?.website.generation.stages.find((s) => s.id === item.id)?.ms,
                    }))}
                    activeIndex={stage}
                    done={Boolean(result) && !generating}
                  />
                </div>
              </div>
            ) : (
              <div className="surface mt-4 p-4">
                <GenerationFlow active={draftState === 'ready' ? 1 : 0} />
                <p className="mt-2.5 text-[0.76rem] leading-relaxed text-[var(--text-muted)]">
                  Describe → WEBORA composes the sections → generate to save the full website with all its pages.
                </p>
              </div>
            )}

            {error ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[0.88rem] font-semibold text-amber-900">We could not finish generating</p>
                  <p className="mt-1 text-[0.84rem] text-amber-800">{error}</p>
                </div>
              </div>
            ) : null}
          </section>

          {/* ── controls ── */}
          <section className="order-3 flex flex-col gap-3">
            <ControlCard title="02 · Generate" hint="The full pipeline: pages, copy, sections, imagery, SEO and a mobile check.">
              {result ? (
                <ResultPanel
                  website={result.website}
                  audit={result.audit}
                  engineLabel={result.engineLabel}
                  engineDetail={result.engineDetail}
                  detected={result.detected}
                  onRegenerate={generate}
                  regenerating={generating}
                  onPublish={publish}
                  publishing={publishing}
                  liveUrl={liveUrl}
                />
              ) : (
                <>
                  <GenerateButton
                    disabledReason={generating ? null : disabledReason}
                    generating={generating}
                    onClick={generate}
                    engineLabel={engine.engine === 'ai-provider' ? engine.label : 'the WEBORA local engine'}
                  />
                  <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                    <p className="text-[0.76rem] font-semibold">Engine: {engine.label}</p>
                    <p className="mt-1 text-[0.74rem] leading-relaxed text-[var(--text-muted)]">{engine.detail}</p>
                  </div>
                </>
              )}
            </ControlCard>

            <ControlCard title="03 · Style" hint="Colours, type and page rhythm for every section.">
              <StylePicker value={styleId} onChange={setStyleId} />
              <p className="mt-2.5 text-[0.72rem] text-[var(--text-muted)]">
                {STYLE_LIST.find((style) => style.id === styleId)?.description}
              </p>
            </ControlCard>

            <ControlCard
              title="04 · Template"
              hint={`Recommended for ${INDUSTRY_LABELS[detectedIndustry] ?? 'your industry'}. Changing it changes the section order.`}
            >
              <TemplatePicker
                templates={templates.map((template) => ({
                  id: template.id,
                  name: template.name,
                  industry: INDUSTRY_LABELS[template.industry] ?? template.industry,
                  styleId: template.styleId,
                }))}
                value={templateId}
                onSelect={(id) => {
                  setTemplateId(id);
                  setStyleId(getTemplate(id).styleId);
                }}
              />
            </ControlCard>

            <ControlCard title="05 · Tone of voice" hint="How your copy should sound.">
              <div className="flex flex-wrap gap-1.5">
                {(['warm', 'bold', 'elegant', 'friendly', 'professional'] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setProfile((current) => ({ ...current, tone }))}
                    aria-pressed={profile.tone === tone}
                    className={cn(
                      'chip capitalize transition',
                      profile.tone === tone && 'border-[var(--accent)] bg-[var(--accent-soft)] text-[#8a3b09]',
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </ControlCard>

            {result && liveUrl ? (
              <ControlCard title="Your address" hint="Published and indexable — search engines can find it.">
                <p className="rounded-lg bg-[var(--surface)] px-3 py-2 font-mono text-[0.78rem] break-all">{liveUrl}</p>
                <div className="mt-2">
                  <CopyButton value={liveUrl} className="w-full justify-center" />
                </div>
              </ControlCard>
            ) : null}
          </section>
        </div>
      </main>

      {/* mobile action bar */}
      <div className="sticky bottom-0 z-40 border-t border-[var(--line)] bg-[rgba(251,250,248,.92)] p-3 backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex w-full max-w-[1520px] items-center gap-3">
          <p className="min-w-0 flex-1 text-[0.74rem] leading-snug text-[var(--text-muted)]">
            {result ? 'Draft saved. Publish when you are ready.' : (disabledReason ?? 'Ready when you are.')}
          </p>
          {result ? (
            <ButtonLink href={`/editor/${result.website.id}`} size="sm">
              Open editor
            </ButtonLink>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={Boolean(disabledReason) || generating}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate website'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Section ids whose props changed between two drafts — what pulses as “updated”. */
function diffSectionIds(previous: Website | null, next: Website): string[] {
  if (!previous) return [];
  const before = new Map<string, string>();
  for (const page of previous.pages) {
    for (const section of page.sections) before.set(`${page.slug}:${section.type}`, JSON.stringify(section.props));
  }
  const changed: string[] = [];
  for (const page of next.pages) {
    for (const section of page.sections) {
      if (before.get(`${page.slug}:${section.type}`) !== JSON.stringify(section.props)) changed.push(section.id);
    }
  }
  return changed;
}
