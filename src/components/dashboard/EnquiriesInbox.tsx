'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Inbox, Mail, Phone } from 'lucide-react';
import type { Website } from '@/types';
import type { Enquiry } from '@/lib/db/types';
import { Badge, EmptyState } from '@/components/ui/primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn, relativeTime } from '@/lib/utils';

export function EnquiriesInbox({
  groups,
}: {
  groups: { website: Website; enquiries: Enquiry[] }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const all = groups.flatMap((group) => group.enquiries.map((enquiry) => ({ enquiry, website: group.website })));
  const shown = filter === 'unread' ? all.filter((item) => !item.enquiry.read) : all;
  const unread = all.filter((item) => !item.enquiry.read).length;

  async function markRead(enquiry: Enquiry, website: Website, read: boolean) {
    setBusyId(enquiry.id);
    try {
      await fetch(`/api/sites/${website.id}/enquiries`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enquiryId: enquiry.id, read }),
      });
      router.refresh();
    } catch {
      toast({ title: 'Could not update that enquiry', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  if (!all.length) {
    return (
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="No enquiries yet"
        description="When someone submits the contact form on one of your published websites, their message appears here with their name, email and phone number."
        action={<ButtonLink href="/dashboard">Back to my websites</ButtonLink>}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-[0.84rem] font-medium transition',
            filter === 'all' ? 'border-[var(--surface-ink)] bg-[var(--surface-ink)] text-white' : 'border-[var(--line)] bg-white text-[var(--text-muted)]',
          )}
        >
          All {all.length}
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-[0.84rem] font-medium transition',
            filter === 'unread' ? 'border-[var(--surface-ink)] bg-[var(--surface-ink)] text-white' : 'border-[var(--line)] bg-white text-[var(--text-muted)]',
          )}
        >
          Unread {unread}
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {shown.map(({ enquiry, website }) => (
          <li
            key={enquiry.id}
            className={cn('surface p-5', !enquiry.read && 'border-l-[3px] border-l-[var(--accent)]')}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[0.98rem] font-semibold">{enquiry.name}</p>
                  {!enquiry.read ? <Badge tone="accent">New</Badge> : null}
                  <Badge tone="neutral">{website.name}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem] text-[var(--text-muted)]">
                  {enquiry.email ? (
                    <a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1.5 hover:text-[var(--text)]">
                      <Mail className="h-3.5 w-3.5" /> {enquiry.email}
                    </a>
                  ) : null}
                  {enquiry.phone ? (
                    <a href={`tel:${enquiry.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--text)]">
                      <Phone className="h-3.5 w-3.5" /> {enquiry.phone}
                    </a>
                  ) : null}
                  <span>{relativeTime(enquiry.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {enquiry.phone ? (
                  <a
                    href={`https://wa.me/${enquiry.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-outline btn-sm"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === enquiry.id}
                  onClick={() => markRead(enquiry, website, !enquiry.read)}
                  icon={<Check className="h-3.5 w-3.5" />}
                >
                  {enquiry.read ? 'Mark unread' : 'Mark read'}
                </Button>
              </div>
            </div>

            <p className="mt-3.5 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-[var(--text)]">{enquiry.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
