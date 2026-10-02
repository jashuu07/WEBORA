'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Globe2, Rocket, TriangleAlert } from 'lucide-react';
import type { Website } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export function PublishDialog({
  website,
  open,
  onClose,
  onPublish,
  publishing,
}: {
  website: Website;
  open: boolean;
  onClose: () => void;
  onPublish: () => Promise<{ url: string } | void>;
  publishing: boolean;
}) {
  const { toast } = useToast();
  const [result, setResult] = useState<{ url: string } | null>(null);

  const visibleSections = website.pages.reduce((n, p) => n + p.sections.filter((s) => s.visible).length, 0);
  const seoReady = website.pages.every((p) => p.seo.title.length > 5 && p.seo.description.length > 40);
  const hasContact = website.pages.some((p) => p.sections.some((s) => s.type === 'contact' && s.visible));
  const emptyPages = website.pages.filter((p) => p.sections.filter((s) => s.visible).length === 0);

  const checks = [
    { label: `${website.pages.length} pages with ${visibleSections} sections`, passed: visibleSections > 0 },
    { label: 'SEO titles and descriptions generated', passed: seoReady },
    { label: 'A contact section visitors can reach', passed: hasContact },
    { label: 'No empty pages', passed: emptyPages.length === 0 },
  ];

  const blocked = checks.some((c) => !c.passed);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={website.status === 'published' ? 'Publish updates' : 'Publish your website'}
      description="Your site goes live at a webora.app address. You can keep editing afterwards — visitors only see what you publish."
      size="md"
      footer={
        result ? (
          <>
            <ButtonLink href={result.url} target="_blank" variant="ink" icon={<ExternalLink className="h-3.5 w-3.5" />}>
              Visit live site
            </ButtonLink>
            <Button variant="outline" onClick={onClose}>
              Keep editing
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={publishing}
              disabled={blocked}
              icon={<Rocket className="h-4 w-4" />}
              onClick={async () => {
                const outcome = await onPublish();
                if (outcome && 'url' in outcome) setResult(outcome);
              }}
            >
              {website.status === 'published' ? 'Publish updates' : 'Publish now'}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-[0.9rem] font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Your website is live
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-2.5 py-1.5 text-[0.82rem]">{result.url}</code>
            <CopyButton value={result.url} label="Copy link" />
          </div>
          <p className="mt-3 text-[0.82rem] text-emerald-800">
            Share this link on WhatsApp, Instagram and your Google Business profile.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-2.5 text-[0.88rem]">
                {check.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                )}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="flex items-center gap-2 text-[0.85rem] font-semibold">
              <Globe2 className="h-4 w-4 text-[var(--accent)]" /> Address
            </p>
            <p className="mt-1.5 text-[0.84rem] text-[var(--text-muted)]">
              Free address: <strong className="font-medium text-[var(--text)]">/s/{website.slug}</strong>
            </p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--text-muted)]">
              Want your own domain?{' '}
              <a href="/dashboard/domains" className="font-semibold text-[var(--accent)] hover:underline">
                Connect a domain from the dashboard
              </a>{' '}
              — WEBORA returns the exact DNS records to add.
            </p>
            {website.domain ? (
              <p className="mt-2 text-[0.82rem] text-[var(--text-muted)]">
                Current domain: <strong className="font-medium text-[var(--text)]">{website.domain.hostname}</strong> ({website.domain.status})
              </p>
            ) : null}
          </div>
        </>
      )}
    </Modal>
  );
}
