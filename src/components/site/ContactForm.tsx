'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * The enquiry form rendered on published websites.
 *
 * It posts to the site's own endpoint, so submissions land in the owner's
 * WEBORA inbox (Dashboard → Enquiries). In editor mode it renders as a
 * non-interactive preview.
 */
export function ContactForm({ slug, editorMode = false, title = 'Send an enquiry' }: { slug: string; editorMode?: boolean; title?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (editorMode) return;
    setState('sending');
    setMessage('');
    try {
      const res = await fetch(`/api/public/${slug}/enquiry`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not send your message.');
      setState('sent');
      setMessage(json.data?.note ?? 'Thanks — your enquiry has been sent.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setState('error');
      setMessage((error as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className="site-card p-6" aria-label={title}>
      <h3 className="text-[1.1rem] font-semibold">{title}</h3>

      {state === 'sent' ? (
        <p
          className="mt-4 rounded-[calc(var(--w-radius)*.8)] px-4 py-3 text-[0.9rem]"
          style={{ background: 'var(--w-accent-soft)', color: 'var(--w-text)' }}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.82rem] font-medium">Your name</span>
          <input
            className="input"
            required
            value={form.name}
            onChange={update('name')}
            disabled={editorMode}
            placeholder="Full name"
            style={{ borderRadius: 'calc(var(--w-radius)*.8)' }}
          />
        </label>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.82rem] font-medium">Email</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={update('email')}
              disabled={editorMode}
              placeholder="you@example.com"
              style={{ borderRadius: 'calc(var(--w-radius)*.8)' }}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.82rem] font-medium">Phone</span>
            <input
              className="input"
              value={form.phone}
              onChange={update('phone')}
              disabled={editorMode}
              placeholder="+91 …"
              style={{ borderRadius: 'calc(var(--w-radius)*.8)' }}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.82rem] font-medium">How can we help?</span>
          <textarea
            className="textarea"
            required
            rows={4}
            value={form.message}
            onChange={update('message')}
            disabled={editorMode}
            placeholder="Tell us what you need and when."
            style={{ borderRadius: 'calc(var(--w-radius)*.8)' }}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="site-btn site-btn-primary"
            disabled={editorMode || state === 'sending'}
            style={editorMode ? { opacity: 0.65, cursor: 'not-allowed' } : undefined}
          >
            {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {state === 'sending' ? 'Sending…' : 'Send enquiry'}
          </button>
          {editorMode ? (
            <span className="text-[0.78rem]" style={{ color: 'var(--w-muted)' }}>
              Live on your published site
            </span>
          ) : null}
        </div>

        {state === 'error' ? (
          <p className="text-[0.85rem] font-medium text-red-600" role="alert">
            {message}
          </p>
        ) : null}
      </div>

      {/* Reassure the owner that this is a real form, not decoration. */}
      {!editorMode ? (
        <p className="mt-4 text-[0.75rem]" style={{ color: 'var(--w-muted)' }}>
          Enquiries are saved to the business inbox in WEBORA.
        </p>
      ) : null}
    </form>
  );
}

export { Button };
