import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { domainSchema } from '@/lib/auth/validation';
import { fail, ok, parseJson, serverError } from '@/lib/api';
import { dnsInstructions, getOwnedWebsite } from '@/lib/sites';
import { PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

/**
 * Custom domains.
 *
 * Without VERCEL_API_TOKEN configured, WEBORA does not pretend to have
 * connected anything: it records the domain as `pending` and returns the exact
 * DNS records + setup steps the owner must complete. With a token present it
 * calls the Vercel Domains API to attach the domain to the project.
 */

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    const instructions = site.domain ? dnsInstructions(site.domain.hostname) : null;
    return ok({
      domain: site.domain ?? null,
      instructions,
      providerConfigured: Boolean(process.env.VERCEL_API_TOKEN),
      planAllowsCustomDomain: PLANS[user.plan].limits.customDomain,
      setupRequirements: [
        'VERCEL_API_TOKEN and VERCEL_PROJECT_ID (custom domains are attached to the Vercel project).',
        'Access to the domain registrar to add the DNS records WEBORA returns.',
        'A paid plan on this deployment — the Free plan does not include custom domains.',
      ],
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    if (!PLANS[user.plan].limits.customDomain) {
      return fail(
        `Custom domains are included from the Starter plan upwards. Your ${user.plan} plan keeps your site on its webora.app address.`,
        402,
      );
    }

    const parsed = await parseJson(request, domainSchema);
    if ('error' in parsed) return fail(parsed.error);
    const { hostname } = parsed.data;

    const { records, requirements } = dnsInstructions(hostname);
    const token = process.env.VERCEL_API_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    let status: 'pending' | 'active' | 'error' = 'pending';
    let message =
      'Domain saved. Add the DNS records below at your registrar — WEBORA will flip this to Active once they resolve.';

    if (token && projectId) {
      try {
        const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ name: hostname }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        if (!res.ok) {
          status = res.status === 409 ? 'pending' : 'error';
          message = data.error?.message ?? `Vercel responded with ${res.status}.`;
        } else {
          message = 'Domain attached to the hosting project. Add the DNS records below to finish verification.';
        }
      } catch (error) {
        status = 'error';
        message = `We could not reach the hosting API: ${(error as Error).message}`;
      }
    }

    const domain = await getStore().upsertDomain(site.id, {
      hostname,
      status,
      dnsRecords: records,
      provider: token && projectId ? 'vercel' : 'manual',
      lastCheckedAt: new Date().toISOString(),
      message,
    });

    await getStore().updateWebsite(site.id, { domain });

    return ok({ domain, instructions: { records, requirements }, providerConfigured: Boolean(token && projectId) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const site = await getOwnedWebsite(id, user.id);
    if (!site) return fail('Website not found.', 404);

    await getStore().removeDomain(site.id);
    await getStore().updateWebsite(site.id, { domain: undefined });
    return ok({ removed: true });
  } catch (error) {
    return serverError(error);
  }
}
