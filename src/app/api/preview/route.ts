import { z } from 'zod';
import { fail, ok, parseJson, rateLimit } from '@/lib/api';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { buildLiveDraft } from '@/lib/preview/draft';
import { detectIndustry } from '@/lib/industry/packs';
import type { IndustryId } from '@/types';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().max(90).default(''),
  description: z.string().trim().max(1200).default(''),
  city: z.string().trim().max(60).default(''),
  services: z.array(z.string().trim().max(80)).max(12).default([]),
  industry: z.string().trim().default('general'),
  styleId: z.string().trim().min(1),
});

/**
 * POST /api/preview
 *
 * The live draft for the /create workspace. It runs the same industry content
 * library the generator uses, but composes a single screenful of sections and
 * writes nothing to storage — so the preview can update on every keystroke
 * without burning generation credits or creating half-finished websites.
 *
 * The response says so explicitly (`persisted: false`), and the UI repeats it.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  if (!rateLimit(`preview:${user.id}`, 120, 60_000)) {
    return fail('Taking a breath — try again in a moment.', 429);
  }

  const parsed = await parseJson(request, schema);
  if ('error' in parsed) return fail(parsed.error);
  const name = parsed.data.name ?? '';
  const description = parsed.data.description ?? '';
  const city = parsed.data.city ?? '';
  const services = parsed.data.services ?? [];
  const styleId = parsed.data.styleId;

  const detection = detectIndustry([description, name, ...services].join(' '));
  const industry = (detection.industry || 'general') as IndustryId;

  if (description.trim().length < 15) {
    return ok({
      ready: false,
      reason: 'Add a sentence or two about the business — the preview builds itself from your description.',
      detected: { industry, confidence: detection.confidence, matched: detection.matched },
    });
  }

  const { website, packLabel } = buildLiveDraft({
    business: { name, description, city, services, industry },
    styleId,
    fallbackIndustry: industry,
  });

  return ok({
    ready: true,
    persisted: false,
    website,
    industry,
    packLabel,
    detected: { industry, confidence: detection.confidence, matched: detection.matched },
  });
}
