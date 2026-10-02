import { z } from 'zod';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, parseJson, rateLimit, serverError } from '@/lib/api';
import { getStore } from '@/lib/db';
import { getOwnedWebsite } from '@/lib/sites';
import { getPack } from '@/lib/industry/packs';
import {
  buildSectionPrompt,
  completeJson,
  COPY_SYSTEM_PROMPT,
  isProviderConfigured,
} from '@/services/ai/provider';
import { fill, heroHeadlineVariants, makeContext } from '@/services/ai/local-engine/copywriter';
import type { BusinessProfile, SectionType } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  siteId: z.string().min(1),
  pageId: z.string().min(1),
  sectionId: z.string().min(1),
  instruction: z.string().trim().max(400).optional(),
});

/**
 * POST /api/ai/section
 *
 * Rewrites one section. With a provider configured the model receives the
 * owner's instruction ("make it warmer", "shorten the headline"); without one
 * WEBORA re-runs its own variation engine, which is honest about what changed.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();

    if (!rateLimit(`ai-section:${user.id}`, 30, 60_000)) {
      return fail('Slow down a moment — try again in a few seconds.', 429);
    }

    const parsed = await parseJson(request, schema);
    if ('error' in parsed) return fail(parsed.error);
    const { siteId, pageId, sectionId, instruction } = parsed.data;

    const site = await getOwnedWebsite(siteId, user.id);
    if (!site) return fail('Website not found.', 404);

    const page = site.pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);
    if (!page || !section) return fail('Section not found.', 404);

    const pack = getPack(site.industry);
    const ctx = makeContext(site.business, pack, Math.floor(Math.random() * 5));
    const current = section.props;

    let next: Record<string, unknown> | null = null;
    let engine: 'local' | 'ai-provider' = 'local';

    if (isProviderConfigured()) {
      const result = await completeJson<Record<string, unknown>>(
        COPY_SYSTEM_PROMPT,
        buildSectionPrompt(site.business as BusinessProfile, section.type, instruction ?? 'Improve this section.')
          + `\n\nCurrent props:\n${JSON.stringify(current).slice(0, 4000)}`,
      );
      if (result && typeof result === 'object') {
        next = result;
        engine = 'ai-provider';
      }
    }

    if (!next) {
      next = localVariation(section.type, current, ctx, instruction);
    }

    const props = { ...current, ...next };
    const pages = structuredClone(site.pages);
    const targetPage = pages.find((p) => p.id === pageId)!;
    const target = targetPage.sections.find((s) => s.id === sectionId)!;
    target.props = props;
    targetPage.updatedAt = new Date().toISOString();

    const saved = await getStore().updateWebsite(site.id, { pages });

    return ok({
      website: saved,
      props,
      engine,
      engineLabel:
        engine === 'ai-provider'
          ? 'Rewritten by your connected AI provider.'
          : 'Rewritten by the WEBORA local engine (no AI provider connected) — using your industry library and business details.',
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Deterministic variation engine: rotates through the industry library so a
 * rewrite always changes something real, without inventing facts.
 */
function localVariation(
  type: SectionType,
  props: Record<string, unknown>,
  ctx: ReturnType<typeof makeContext>,
  instruction?: string,
): Record<string, unknown> {
  const pack = ctx.pack;
  const shorter = (text: unknown, words = 8) =>
    typeof text === 'string' ? text.split(/\s+/).slice(0, words).join(' ') : text;

  switch (type) {
    case 'hero': {
      // Rotate through on-brand alternates, always landing on something that is
      // actually different from what is on the page right now — a "rewrite"
      // that returns the same words would be dishonest.
      const current = String(props.heading ?? '').trim();
      const variants = heroHeadlineVariants(ctx);
      const next = variants.find((line) => line.trim() !== current) ?? variants[0] ?? current;
      const shortened = next.split(/\s+/).slice(0, 7).join(' ').replace(/[,;:]$/, '');
      return {
        heading: instruction?.toLowerCase().includes('short') ? shortened : next,
        sub: fill(String(pack.heroSub), ctx),
        eyebrow: fill(pack.heroEyebrow, ctx),
      };
    }
    case 'about':
      return {
        heading: fill(pack.aboutHeading, ctx),
        body: fill(pack.aboutBody, ctx) + (instruction?.toLowerCase().includes('short') ? '' : ' ' + pack.promise),
        items: pack.aboutBullets.map((text) => ({ text: fill(text, ctx) })),
      };
    case 'services':
      return { heading: pack.offersHeading, sub: fill(pack.offersSub, ctx), items: pack.offers };
    case 'testimonials':
      return { items: pack.testimonials };
    case 'faq':
      return { items: pack.faqs.map((f) => ({ q: fill(f.q, ctx), a: fill(f.a, ctx) })) };
    case 'cta':
      return {
        heading: instruction?.toLowerCase().includes('short') ? 'Ready when you are' : fill(pack.promise, ctx),
        sub: fill(pack.heroSub, ctx),
      };
    case 'stats':
      return { items: pack.stats.map((s) => ({ value: s.value, label: fill(s.label, ctx) })) };
    case 'gallery':
      return {
        items: pack.galleryCaptions.slice(0, 6).map((caption) => {
          const existing = (props.items as { image?: string }[] | undefined) ?? [];
          const image = existing[0]?.image ?? '';
          return { image, caption: fill(caption, ctx) };
        }),
      };
    case 'contact':
      return {
        heading: `${pack.primaryCta}? Let's talk.`,
        sub: `Tell us what you need and we will come back to you with next steps.`,
      };
    default:
      return { sub: shorter(props.sub, 14) };
  }
}
