import type { Metadata } from 'next';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal, SectionHeading } from '@/components/ui/primitives';
import { HowItWorks, IndustryStrip } from '@/components/marketing/Blocks';
import { generationEngineStatus, GENERATION_STAGES } from '@/services/ai';
import { storageStatus } from '@/lib/db';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'From a one-line business description to a published website: the WEBORA generation pipeline, editor and publishing flow.',
};

export default function HowItWorksPage() {
  const engine = generationEngineStatus();
  const storage = storageStatus();

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">How it works</p>
        <h1 className="display-2">From one sentence to a live website</h1>
        <p className="lede mt-5">
          WEBORA is not a mockup: this page describes exactly what the application does, including which engine writes
          your copy and where your data is stored on this deployment.
        </p>
      </div>

      <HowItWorks />

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-7">
          <h2 className="text-[1.15rem] font-semibold">The generation pipeline</h2>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--text-muted)]">
            Six real stages run on the server. Each one reports its measured duration, which is what the progress
            screen displays.
          </p>
          <ol className="mt-6 flex flex-col gap-4">
            {GENERATION_STAGES.map((stage, index) => (
              <li key={stage.id} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-ink)] text-[0.72rem] font-semibold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-[0.94rem] font-semibold">{stage.label}</span>
                  <span className="mt-0.5 block text-[0.86rem] text-[var(--text-muted)]">{stage.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-7">
            <h2 className="text-[1.15rem] font-semibold">Which engine is running now</h2>
            <div className="mt-4 flex items-center gap-2">
              <span className={engine.engine === 'ai-provider' ? 'chip chip-live' : 'chip chip-accent'}>
                {engine.label}
              </span>
            </div>
            <p className="mt-4 text-[0.9rem] leading-relaxed text-[var(--text-muted)]">{engine.detail}</p>
            <p className="mt-4 text-[0.85rem] text-[var(--text-muted)]">
              The UI never labels local output as “AI generated” — the editor shows the engine that produced each
              website in its generation details panel.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-7">
            <h2 className="text-[1.15rem] font-semibold">Where your data lives</h2>
            <div className="mt-4">
              <span className="chip">{storage.active === 'supabase' ? 'Supabase Postgres' : 'Local JSON store'}</span>
            </div>
            <p className="mt-4 text-[0.9rem] leading-relaxed text-[var(--text-muted)]">{storage.detail}</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-ink)] p-7 text-white">
            <h2 className="text-[1.15rem] font-semibold">Try it with your own business</h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-white/70">
              Bring your business name, a sentence about what you do, and your phone number. That is all WEBORA needs
              for a complete first draft.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/signup" icon={<Sparkles className="h-4 w-4" />}>
                Create my website
              </ButtonLink>
              <ButtonLink
                href="/templates"
                variant="ghost"
                className="border border-white/25 text-white hover:bg-white/10"
              >
                Browse templates
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <Reveal>
          <SectionHeading
            eyebrow="What you get"
            title="Built for the way customers actually find you"
            description="A fast, mobile-first site with the contact methods that work in India — WhatsApp, one-tap calling and maps — plus structured data for search engines."
          />
        </Reveal>
      </section>

      <div className="-mx-5 mt-14 sm:-mx-8">
        <IndustryStrip />
      </div>
    </div>
  );
}
