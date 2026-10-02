# Payments

**Nothing is charged on this deployment.** WEBORA is honest about that: the
pricing page and Dashboard → Settings both state it, and switching a plan updates
the workspace limits immediately so features can be evaluated without a card.

## What already works

- Plans are defined once in `src/lib/plans.ts` (Free / Starter / Pro) with price,
  currency, feature list and enforced limits (websites, pages, custom domain,
  analytics, branding removal, AI credits).
- Limits are enforced server-side: `canCreateWebsite()` blocks site creation,
  the pages endpoint checks `limits.pages`, and the domain route checks
  `limits.customDomain` — each returns a `402` with a human explanation.
- The billing endpoint reports readiness instead of faking a checkout:
  `POST /api/billing/checkout` returns `configured: false`, the amount, the
  currency and the exact setup requirements when no provider is present.
- The UI shows those requirements verbatim on the Settings page.

## Orders of work to turn it on

### 1. Environment

```bash
PAYMENTS_PROVIDER=razorpay          # or stripe
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
# or
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 2. Create the order

`src/app/api/billing/checkout/route.ts` contains the marked block:

```ts
// TO IMPLEMENT: create the provider order/session here.
```

Razorpay:

```ts
const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
const order = await fetch('https://api.razorpay.com/v1/orders', {
  method: 'POST',
  headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
  body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: `webora_${user.id}` }),
}).then((r) => r.json());
return ok({ configured: true, orderId: order.id, amount, currency });
```

Stripe:

```ts
const session = await fetch('https://api.stripe.com/v1/checkout/sessions', {
  method: 'POST',
  headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': process.env.STRIPE_PRICE_STARTER!,
    'line_items[0][quantity]': '1',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  }),
}).then((r) => r.json());
return ok({ configured: true, checkoutUrl: session.url });
```

### 3. Confirm and record

Add `src/app/api/billing/webhook/route.ts`:

1. Verify the signature (`x-razorpay-signature` with HMAC-SHA256 of the body, or
   `stripe.webhooks.constructEvent`).
2. On success, `getStore().updateUser(userId, { plan })`.
3. Store the subscription id, current period end and provider alongside the user
   (add columns in a new migration if you want billing history).

### 4. Client

`src/components/dashboard/SettingsPanel.tsx` already calls the checkout endpoint
before switching plans — when `configured` is true, route the user to
`checkoutUrl` (Stripe) or open Razorpay Checkout with `orderId` and then confirm
the signature server-side. No other client change is required.

## Testing without a provider

Plan switching is deliberately independent of payment: choose a plan in
Dashboard → Settings and the limits change immediately. This is what makes the
Pro-only features (analytics dashboard, custom domains, 10 websites) evaluable on
a fresh clone.
