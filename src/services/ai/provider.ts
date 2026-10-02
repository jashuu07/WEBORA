import type { BusinessProfile, IndustryPack } from '@/types';
import type { CopyDeck } from './local-engine/copywriter';

/**
 * AI provider abstraction.
 *
 * WEBORA works with three shapes of provider and degrades gracefully:
 *
 *   1. no provider configured  → deterministic local engine (default)
 *   2. provider configured     → the model *refines* the local draft
 *   3. provider errors/timeouts → the local draft is kept, engine is labelled
 *
 * Keys are read from the server environment only (`AI_API_KEY`). Nothing in
 * this file is imported by a client component, and the API routes that call it
 * run on the server, so no key can reach the browser.
 */

export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible';

export interface ProviderConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
  maxTokens: number;
}

export function providerConfig(): ProviderConfig | null {
  const provider = (process.env.AI_PROVIDER ?? '').trim() as ProviderId | '';
  const apiKey = (process.env.AI_API_KEY ?? '').trim();
  if (!provider || !apiKey) return null;

  const defaults: Record<ProviderId, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-latest',
    gemini: 'gemini-1.5-pro',
    'openai-compatible': 'llama-3.1-70b-instruct',
  };

  return {
    provider,
    apiKey,
    model: (process.env.AI_MODEL ?? '').trim() || defaults[provider] || 'gpt-4o-mini',
    baseUrl: (process.env.AI_BASE_URL ?? '').trim() || defaultBaseUrl(provider),
    maxTokens: Number(process.env.AI_MAX_TOKENS ?? 4096),
  };
}

function defaultBaseUrl(provider: ProviderId): string | undefined {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com/v1';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta';
    default:
      return undefined;
  }
}

export function isProviderConfigured(): boolean {
  return providerConfig() !== null;
}

const TIMEOUT_MS = 25_000;

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await p(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Ask the model for a single JSON object. Returns null on any failure. */
export async function completeJson<T>(system: string, user: string): Promise<T | null> {
  const cfg = providerConfig();
  if (!cfg) return null;

  try {
    const text = await withTimeout(async (signal) => {
      if (cfg.provider === 'anthropic') {
        const res = await fetch(`${cfg.baseUrl}/messages`, {
          method: 'POST',
          signal,
          headers: {
            'content-type': 'application/json',
            'x-api-key': cfg.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: cfg.model,
            max_tokens: cfg.maxTokens,
            system,
            messages: [{ role: 'user', content: user }],
          }),
        });
        if (!res.ok) throw new Error(`anthropic ${res.status}`);
        const data = await res.json();
        return data?.content?.[0]?.text ?? '';
      }

      if (cfg.provider === 'gemini') {
        const res = await fetch(
          `${cfg.baseUrl}/models/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
          {
            method: 'POST',
            signal,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: 'user', parts: [{ text: user }] }],
              generationConfig: { responseMimeType: 'application/json', maxOutputTokens: cfg.maxTokens },
            }),
          },
        );
        if (!res.ok) throw new Error(`gemini ${res.status}`);
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }

      // OpenAI + any OpenAI-compatible endpoint (Groq, Together, OpenRouter, vLLM…)
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: cfg.maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`openai ${res.status}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? '';
    });

    const json = extractJson(text);
    return json ? (json as T) : null;
  } catch (error) {
    console.warn('[webora:ai] provider call failed, using local engine instead:', (error as Error).message);
    return null;
  }
}

function extractJson(text: string): unknown {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Prompts                                                                   */
/* -------------------------------------------------------------------------- */

export interface RefinedCopy {
  hero?: { heading?: string; sub?: string; eyebrow?: string };
  about?: { heading?: string; body?: string };
  offers?: { title?: string; description?: string; price?: string }[];
  faqs?: { q: string; a: string }[];
  seo?: { title?: string; description?: string; keywords?: string[] };
}

const SYSTEM = `You are WEBORA's senior website copywriter for small businesses.
You write short, specific, confident copy that sounds like a real local business — never generic marketing filler.
Rules:
- No invented awards, certifications, statistics, client names or guarantees.
- Use only the facts provided. If a detail is missing, write around it.
- Headlines: max 8 words, no exclamation marks, sentence case.
- Body copy: 2-4 sentences, second person, concrete nouns.
- Never mention that you are an AI.
Reply with JSON only, matching the requested shape exactly.`;

export function buildCopyPrompt(profile: BusinessProfile, pack: IndustryPack, deck: CopyDeck): string {
  return JSON.stringify(
    {
      business: {
        name: profile.name,
        type: profile.type,
        industry: pack.label,
        description: profile.description,
        city: profile.city,
        services: profile.services,
        tone: profile.tone,
      },
      existing_draft: {
        hero_heading: deck.hero.heading,
        hero_sub: deck.hero.sub,
        about_heading: deck.about.heading,
        about_body: deck.about.body,
        offers: deck.offers.map((o) => o.title),
      },
      task:
        'Improve the draft using the business facts. Keep the same language and market. ' +
        'Return JSON: { "hero": {"heading","sub","eyebrow"}, "about": {"heading","body"}, ' +
        '"offers": [{"title","description"}] for each existing offer in the same order, ' +
        '"faqs": [{"q","a"}] with 4 questions, "seo": {"title","description","keywords":[]} }',
    },
    null,
    2,
  );
}

export function buildSectionPrompt(profile: BusinessProfile, sectionType: string, instruction: string): string {
  return JSON.stringify(
    {
      business: { name: profile.name, type: profile.type, city: profile.city, description: profile.description },
      section: sectionType,
      instruction,
      task: 'Return JSON for the section props only, matching the shape implied by the instruction.',
    },
    null,
    2,
  );
}

export const COPY_SYSTEM_PROMPT = SYSTEM;
