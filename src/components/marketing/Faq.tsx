'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I need to know anything about websites or code?',
    a: 'No. You describe your business in plain language, WEBORA writes the pages, and the editor works by clicking on things you want to change.',
  },
  {
    q: 'Is the content actually written for my business, or is it filler?',
    a: 'You get real, industry-specific copy: your services become your service cards, your city appears in your headings, and your hours and phone number flow into the contact and footer sections. Everything is editable, and nothing invents awards or claims you did not tell us about.',
  },
  {
    q: 'What happens when I publish?',
    a: 'Your site goes live at a webora.app address you can share immediately. If you add a custom domain, WEBORA shows the exact DNS records to add and verifies them for you.',
  },
  {
    q: 'Can I edit after publishing?',
    a: 'Yes. Published sites keep a live version and a draft. Edit the draft, preview it, then publish when you are happy — visitors never see a half-finished change.',
  },
  {
    q: 'What about WhatsApp and calls?',
    a: 'Add your number once and WEBORA places WhatsApp, call and map buttons in the navigation, hero, contact section and footer — the things Indian customers actually use.',
  },
  {
    q: 'Do you track visitors?',
    a: 'WEBORA records first-party page views for your own dashboard — path, device type and referrer host. No third-party analytics script, no cookies, no selling data.',
  },
  {
    q: 'How do payments work?',
    a: 'Payment processing is not enabled on this deployment. You can switch plans instantly while evaluating; the Razorpay and Stripe integration points are documented and ready to switch on.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {FAQS.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-6 py-5 text-left"
            >
              <span className="text-[1.02rem] font-semibold tracking-[-0.01em]">{item.q}</span>
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-[var(--text-muted)]">
                {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </span>
            </button>
            <div
              className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
            >
              <p className="min-h-0 max-w-3xl pb-6 pr-10 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
