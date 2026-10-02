import type { Metadata } from 'next';
import { TemplateShowcase } from '@/components/marketing/TemplateShowcase';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/primitives';
import { STYLE_LIST } from '@/lib/design/styles';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'Nine premium website templates for bakeries, restaurants, salons, gyms, consultants, portfolios, real estate, photography and local shops.',
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">Templates</p>
        <h1 className="display-2">Premium starting points for every local trade</h1>
        <p className="lede mt-5">
          Each template decides the section order, imagery and typography for that industry — then WEBORA writes your
          content into it. Change template later and your content comes with you.
        </p>
      </div>

      <div className="mt-14">
        <TemplateShowcase />
      </div>

      <section className="mt-20 rounded-[26px] border border-[var(--line)] bg-white p-8 sm:p-10">
        <SectionHeading
          eyebrow="Design system"
          title="Six style presets, applied consistently"
          description="Styles are token sets — colours, type pairing, corner radius and page rhythm. Switch one and every section updates together, so your site never looks hand-mixed."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STYLE_LIST.map((style) => (
            <div key={style.id} className="rounded-2xl border border-[var(--line)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[1rem] font-semibold">{style.name}</p>
                <div className="flex gap-1">
                  {style.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ background: swatch }}
                      title={swatch}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-[var(--text-muted)]">{style.description}</p>
              <p className="mt-4 text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {style.bestFor.join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-3">
        <ButtonLink href="/signup" size="lg" icon={<Sparkles className="h-4 w-4" />}>
          Create my website
        </ButtonLink>
        <ButtonLink href="/pricing" variant="outline" size="lg">
          See pricing
        </ButtonLink>
      </div>
    </div>
  );
}
