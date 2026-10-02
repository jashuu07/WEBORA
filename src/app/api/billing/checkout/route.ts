import { z } from 'zod';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, parseJson } from '@/lib/api';
import { PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

const schema = z.object({
  plan: z.enum(['starter', 'pro']),
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
});

/**
 * POST /api/billing/checkout
 *
 * Payment integration architecture. WEBORA never charges anyone: when no
 * provider credentials exist it returns the exact checklist below and the UI
 * shows it, rather than a fake "payment successful" screen.
 *
 * With RAZORPAY_KEY_ID or STRIPE_SECRET_KEY set, create the order/session in
 * the marked block and return its URL — the rest of the flow is unchanged.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsed = await parseJson(request, schema);
  if ('error' in parsed) return fail(parsed.error);
  const { plan, interval } = parsed.data;

  const definition = PLANS[plan];
  const amount = interval === 'yearly' ? definition.priceYearly : definition.priceMonthly;

  const provider = (process.env.PAYMENTS_PROVIDER ?? '').toLowerCase();
  const razorpayReady = provider === 'razorpay' && Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const stripeReady = provider === 'stripe' && Boolean(process.env.STRIPE_SECRET_KEY);

  if (!razorpayReady && !stripeReady) {
    return ok({
      configured: false,
      plan,
      interval,
      amount,
      currency: definition.currency,
      paymentProcessed: false,
      message:
        'Payments are not enabled on this deployment. Your plan can be switched instantly from Settings while you evaluate WEBORA — no card is charged.',
      setupRequirements: [
        'Add PAYMENTS_PROVIDER=razorpay (or stripe) to your environment.',
        'Razorpay: set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and the webhook secret; Stripe: set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
        'Create the product/price in the provider dashboard and point the webhook at /api/billing/webhook.',
        'Implement the order creation in app/api/billing/checkout/route.ts (marked TO IMPLEMENT) — the client call is already wired.',
      ],
    });
  }

  // TO IMPLEMENT: create the provider order/session here.
  // Razorpay: POST https://api.razorpay.com/v1/orders  (basic auth with key id/secret)
  // Stripe:   POST https://api.stripe.com/v1/checkout/sessions
  return fail(
    'Provider credentials are present but order creation has not been implemented for this deployment yet. See docs/PAYMENTS.md.',
    501,
  );
}
