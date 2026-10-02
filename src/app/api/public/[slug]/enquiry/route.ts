import { getStore } from '@/lib/db';
import { enquirySchema } from '@/lib/auth/validation';
import { clientIp, fail, ok, parseJson, rateLimit, serverError } from '@/lib/api';

export const runtime = 'nodejs';

/** POST /api/public/:slug/enquiry — contact form submission from a live site. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const store = getStore();
    const site = await store.getWebsiteBySlug(slug);
    if (!site || site.status !== 'published') return fail('This website is not available.', 404);

    if (!rateLimit(`enquiry:${clientIp(request)}`, 6, 60_000)) {
      return fail('You have sent several messages already. Please try again in a minute.', 429);
    }

    const parsed = await parseJson(request, enquirySchema);
    if ('error' in parsed) return fail(parsed.error);

    const { name, email, phone, message } = parsed.data;
    if (!email && !phone) return fail('Add an email or phone number so they can reply.');

    const enquiry = await store.createEnquiry({
      id: `en_${Math.random().toString(36).slice(2, 10)}`,
      websiteId: site.id,
      name,
      email,
      phone: phone || undefined,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return ok({
      received: true,
      id: enquiry.id,
      // What actually happens next, stated plainly for the visitor.
      note: site.business.phone
        ? 'Your enquiry is saved in the owner’s WEBORA inbox. For an urgent reply, call or WhatsApp them directly.'
        : 'Your enquiry has been saved and the business will get back to you.',
    });
  } catch (error) {
    return serverError(error, 'We could not send that message.');
  }
}
