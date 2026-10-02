'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Rocket,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { Website } from '@/types';
import { Badge, CopyButton, StatusChip } from '@/components/ui/primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { INDUSTRY_LABELS } from '@/lib/templates/catalog';
import { getStyle } from '@/lib/design/styles';
import { relativeTime, cn } from '@/lib/utils';

interface Props {
  website: Website;
  /** Visitors recorded in the last 30 days, when available. */
  visitors?: number;
}

export function WebsiteCard({ website, visitors }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'delete'>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const style = getStyle(website.styleId);
  const home = website.pages.find((p) => p.slug === 'home') ?? website.pages[0];
  const hero = home?.sections.find((s) => s.type === 'hero');
  const heroImage = (hero?.props?.image as string) ?? '';
  const heroHeading = ((hero?.props?.heading as string) ?? website.name).split('\n')[0];
  const published = website.status === 'published';

  async function publish(action: 'publish' | 'unpublish') {
    setBusy(action);
    try {
      const res = await fetch(`/api/sites/${website.id}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not update the publishing state.');
      toast({
        title: action === 'publish' ? 'Website published' : 'Website unpublished',
        description:
          action === 'publish'
            ? `Live at ${window.location.origin}${json.data.url}`
            : 'Your site is back to draft. The live link now returns a 404.',
        tone: 'success',
      });
      router.refresh();
    } catch (error) {
      toast({ title: 'Something went wrong', description: (error as Error).message, tone: 'error' });
    } finally {
      setBusy(null);
      setMenuOpen(false);
    }
  }

  async function duplicate() {
    setBusy('duplicate');
    try {
      const res = await fetch(`/api/sites/${website.id}/duplicate`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not duplicate.');
      toast({ title: 'Website duplicated', description: `${json.data.website.name} is ready as a draft.`, tone: 'success' });
      router.refresh();
    } catch (error) {
      toast({ title: 'Something went wrong', description: (error as Error).message, tone: 'error' });
    } finally {
      setBusy(null);
      setMenuOpen(false);
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      const res = await fetch(`/api/sites/${website.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not delete.');
      toast({ title: 'Website deleted', description: `${website.name} and its enquiries were removed.`, tone: 'info' });
      router.refresh();
    } catch (error) {
      toast({ title: 'Something went wrong', description: (error as Error).message, tone: 'error' });
    } finally {
      setBusy(null);
      setConfirm(null);
      setMenuOpen(false);
    }
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/s/${website.slug}` : `/s/${website.slug}`;

  return (
    <article className="group surface overflow-hidden">
      <div className="relative h-[168px] overflow-hidden border-b border-[var(--line)]" style={{ background: style.tokens.surfaceAlt }}>
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : null}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(10,10,12,.05) 0%, rgba(10,10,12,.72) 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p
            className="truncate text-[1.02rem] font-semibold text-white"
            style={{ fontFamily: style.tokens.headingFont === 'display' ? 'var(--font-display)' : undefined }}
          >
            {website.name}
          </p>
          <p className="mt-0.5 truncate text-[0.8rem] text-white/70">{heroHeading}</p>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <StatusChip status={website.status} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-[0.78rem] text-[var(--text-muted)]">
          <Badge tone="neutral">{INDUSTRY_LABELS[website.industry]}</Badge>
          <span>{style.name}</span>
        </div>

        <dl className="mt-3.5 grid grid-cols-3 gap-3 border-y border-[var(--line)] py-3 text-[0.8rem]">
          <div>
            <dt className="text-[var(--text-muted)]">Pages</dt>
            <dd className="mt-0.5 font-semibold">{website.pages.length}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Updated</dt>
            <dd className="mt-0.5 font-semibold">{relativeTime(website.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Visitors 30d</dt>
            <dd className="mt-0.5 font-semibold">{typeof visitors === 'number' ? visitors : '—'}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center gap-2">
          <ButtonLink href={`/editor/${website.id}`} size="sm" icon={<Pencil className="h-3.5 w-3.5" />} className="flex-1">
            Edit
          </ButtonLink>
          <ButtonLink
            href={`/s/${website.slug}`}
            target="_blank"
            variant="outline"
            size="sm"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
          >
            Preview
          </ButtonLink>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              aria-label="More actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-52 animate-scale-in rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-md)]">
                  <MenuItem
                    icon={published ? <Undo2 className="h-3.5 w-3.5" /> : <Rocket className="h-3.5 w-3.5" />}
                    label={published ? 'Unpublish' : 'Publish'}
                    onClick={() => publish(published ? 'unpublish' : 'publish')}
                    busy={busy === 'publish' || busy === 'unpublish'}
                  />
                  <MenuItem
                    icon={<Copy className="h-3.5 w-3.5" />}
                    label="Duplicate"
                    onClick={duplicate}
                    busy={busy === 'duplicate'}
                  />
                  <MenuItem
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                    label="Open live site"
                    onClick={() => window.open(`/s/${website.slug}`, '_blank')}
                  />
                  <div className="my-1 h-px bg-[var(--line)]" />
                  <MenuItem
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    label="Delete website"
                    tone="danger"
                    onClick={() => setConfirm('delete')}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        {published ? (
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-[var(--surface)] px-2.5 py-1.5 text-[0.76rem] text-[var(--text-muted)]">
              /s/{website.slug}
            </code>
            <CopyButton value={publicUrl} label="Copy" />
          </div>
        ) : null}
      </div>

      <Modal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title={`Delete “${website.name}”?`}
        description="This removes the website, its pages, enquiries and analytics. Published links will stop working. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button variant="primary" loading={busy === 'delete'} onClick={remove}>
              Delete permanently
            </Button>
          </>
        }
      />
    </article>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = 'default',
  busy,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.85rem] font-medium transition-colors disabled:opacity-60',
        tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-[var(--text)] hover:bg-[#f6f5f2]',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
