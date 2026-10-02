import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Globe2,
  LayoutTemplate,
  MessageCircle,
  Pencil,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal, SectionHeading } from '@/components/ui/primitives';
import { INDUSTRY_PACKS } from '@/lib/industry/packs';

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI generated design',
    body: 'Six layout families and nine industry blueprints. WEBORA picks the structure that suits your business, then writes every headline.',
  },
  {
    icon: Pencil,
    title: 'Real visual editor',
    body: 'Click any text on your site and type. Add sections, reorder them, swap images and change colours with a live preview.',
  },
  {
    icon: Smartphone,
    title: 'Mobile optimised',
    body: 'Every section is built responsive-first. Check desktop, tablet and mobile previews before you publish.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp & call buttons',
    body: 'Customers in India convert on WhatsApp. Add one-tap chat, call and map buttons in a single toggle.',
  },
  {
    icon: Search,
    title: 'SEO ready',
    body: 'Titles, meta descriptions, Open Graph tags and a sitemap are generated for every page — with a checklist to improve them.',
  },
  {
    icon: Globe2,
    title: 'Custom domain',
    body: 'Start on a free webora.app address, connect your own domain when you are ready. DNS instructions are generated for you.',
  },
];

const STEPS = [
  {
    icon: Sparkles,
    title: 'Describe your business',
    body: '“I own a bakery in Hyderabad. We sell cakes, pastries and coffee.” That is enough — add services, phone and hours if you have them.',
    detail: 'Step 1',
  },
  {
    icon: LayoutTemplate,
    title: 'Choose a style',
    body: 'Six premium presets — Warm Artisan, Noir Luxe, Bold Energy and more. WEBORA recommends one for your industry, or pick your own.',
    detail: 'Step 2',
  },
  {
    icon: Wand2,
    title: 'Generate your website',
    body: 'Pages, copy, sections, imagery and SEO are produced together, then checked for mobile layout before you see them.',
    detail: 'Step 3',
  },
  {
    icon: Pencil,
    title: 'Customise everything',
    body: 'Edit text inline, add sections, swap photos, adjust spacing and colours. Autosave keeps a draft as you work.',
    detail: 'Step 4',
  },
  {
    icon: Rocket,
    title: 'Publish',
    body: 'One click puts your site online at your own address. Publish again whenever you update — visitors always see the latest version.',
    detail: 'Step 5',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="border-y border-[var(--line)] bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Everything included"
            title="A complete website studio, not a page generator"
            description="WEBORA handles the parts small businesses actually get stuck on: writing the copy, structuring the pages, and making it work on a phone."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 45}>
                <article className="card-3d-inner h-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)]">
                  <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-[#c2520d]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-[1.05rem] font-semibold tracking-[-0.01em]">{feature.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--text-muted)]">{feature.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ compact = false }: { compact?: boolean }) {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Five steps from description to live website"
            description={
              compact
                ? 'No templates to wrangle, no copy to write from scratch, no developer to hire.'
                : 'Most owners finish in under fifteen minutes — including the edits.'
            }
          />
        </Reveal>

        <ol className="mt-14 grid gap-5 lg:grid-cols-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index * 60}>
                <li className="relative h-full rounded-2xl border border-[var(--line)] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-ink)] text-white">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#b6b1a8]">
                      {step.detail}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[1rem] font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[0.88rem] leading-relaxed text-[var(--text-muted)]">{step.body}</p>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function IndustryStrip() {
  const packs = Object.values(INDUSTRY_PACKS).filter((p) => p.id !== 'general');
  return (
    <section className="section-lift border-t border-[var(--line)] py-14">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <p className="text-center text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Content libraries built for
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {packs.map((pack) => (
            <span
              key={pack.id}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-[0.86rem] font-medium"
            >
              <span aria-hidden>{pack.emoji}</span>
              {pack.label}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-[0.84rem] text-[var(--text-muted)]">
          Each library carries real services, menus, FAQs, testimonials and SEO terms for that trade — so your first
          draft already sounds like your business.
        </p>
      </div>
    </section>
  );
}

export function TrustPanel() {
  const items = [
    { icon: BadgeCheck, label: 'Nothing is published without your click' },
    { icon: Clock, label: 'Autosaved drafts, versioned on every publish' },
    { icon: ShieldCheck, label: 'Your data stays in your own database' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.label} className="inline-flex items-center gap-2 text-[0.84rem] font-medium text-[var(--text-muted)]">
            <Icon className="h-4 w-4 text-[var(--accent)]" />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[28px] bg-[var(--surface-ink)] px-7 py-14 text-center sm:px-16 sm:py-20">
            <div
              className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(242,106,27,.55), transparent 68%)' }}
            />
            <div className="relative mx-auto max-w-2xl">
              <p className="eyebrow text-white/60">Your business deserves better than a social media page</p>
              <h2 className="display-2 mt-4 text-white">
                Get your website online.
                <br />
                Built with AI.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[1.02rem] leading-relaxed text-white/70">
                Describe your business, pick a style and publish. Free to start — no card, no developer, no waiting.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/signup" size="lg" icon={<Sparkles className="h-4 w-4" />}>
                  Create My Website
                </ButtonLink>
                <Link
                  href="/how-it-works"
                  className="btn btn-lg border border-white/25 bg-transparent text-white hover:bg-white/10"
                >
                  See How It Works
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-6 text-[0.82rem] text-white/50">
                Free plan includes a published website with a webora.app address.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
