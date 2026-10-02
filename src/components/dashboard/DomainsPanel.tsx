'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Globe2, Info, Loader2, Trash2 } from 'lucide-react';
import type { Website } from '@/types';
import { Badge, CopyButton, EmptyState, StatusChip } from '@/components/ui/primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

interface DomainResponse {
  domain: Website['domain'] | null;
  instructions: { records: { type: string; name: string; value: string }[]; requirements: string[] } | null;
  providerConfigured: boolean;
  planAllowsCustomDomain: boolean;
  setupRequirements: string[];
}

export function DomainsPanel({ websites }: { websites: Website[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState(websites[0]?.id ?? '');
  const [hostname, setHostname] = useState('');
  const [data, setData] = useState<DomainResponse | null>(null);
  const [busy, setBusy] = useState<'connect' | 'remove' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const site = websites.find((w) => w.id === selectedId);

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${id}/domain`);
      const json = await res.json();
      if (json.ok) setData(json.data);
    } catch {
      setError('We could not load the domain settings for that website.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs in the browser only (never during server rendering, where a relative
  // fetch URL has no origin) and reloads whenever a different site is picked.
  useEffect(() => {
    void load(selectedId);
  }, [selectedId, load]);

  async function connect() {
    setBusy('connect');
    setError('');
    try {
      const res = await fetch(`/api/sites/${selectedId}/domain`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hostname }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not save the domain.');
      setData((prev) => ({ ...(prev as DomainResponse), domain: json.data.domain, instructions: json.data.instructions, providerConfigured: json.data.providerConfigured }));
      toast({
        title: 'Domain saved',
        description: 'Add the DNS records below to finish connecting it.',
        tone: 'success',
      });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy('remove');
    try {
      await fetch(`/api/sites/${selectedId}/domain`, { method: 'DELETE' });
      setData((prev) => ({ ...(prev as DomainResponse), domain: null, instructions: null }));
      toast({ title: 'Domain removed', tone: 'info' });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!websites.length) {
    return (
      <EmptyState
        icon={<Globe2 className="h-5 w-5" />}
        title="No websites yet"
        description="Create a website first, then connect your own domain to it."
        action={<ButtonLink href="/create">Create a website</ButtonLink>}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="select max-w-[280px]"
          value={selectedId}
          onChange={(e) => {
            // The effect above reloads the domain data for the new selection.
            setSelectedId(e.target.value);
            setHostname('');
            setError('');
          }}
          aria-label="Choose a website"
        >
          {websites.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {site ? <StatusChip status={site.status} /> : null}
        {loading ? (
          <span className="text-[0.8rem] text-[var(--text-muted)]">Loading domain settings…</span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <section className="surface p-5">
          <h2 className="text-[1rem] font-semibold">Connect a domain</h2>
          <p className="mt-1.5 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">
            Enter the domain you own, for example <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">thebakeryhouse.in</code>.
            WEBORA records it, tells you exactly which DNS records to add, and flags it active once they resolve.
          </p>

          {data && !data.planAllowsCustomDomain ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[0.84rem] leading-relaxed text-amber-900">
                Custom domains are included from the Starter plan upwards. Your current plan keeps the site on its
                webora.app address.
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3">
            <TextInput
              label="Domain"
              placeholder="yourbusiness.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))}
              error={error || undefined}
              leading={<Globe2 className="h-4 w-4" />}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button loading={busy === 'connect'} disabled={!hostname || (data ? !data.planAllowsCustomDomain : false)} onClick={connect}>
                Save & get DNS records
              </Button>
              {data?.domain ? (
                <Button variant="ghost" loading={busy === 'remove'} onClick={remove} icon={<Trash2 className="h-3.5 w-3.5" />}>
                  Remove domain
                </Button>
              ) : null}
            </div>
          </div>

          {data?.domain ? (
            <div className="mt-6 rounded-xl border border-[var(--line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[0.95rem] font-semibold">{data.domain.hostname}</p>
                  <p className="mt-0.5 text-[0.8rem] text-[var(--text-muted)]">
                    {data.domain.provider === 'vercel' ? 'Attached to your hosting project' : 'Manual DNS setup'} ·{' '}
                    checked {formatDate(data.domain.lastCheckedAt)}
                  </p>
                </div>
                <DomainStatus status={data.domain.status} />
              </div>

              {data.domain.message ? (
                <p className="mt-3 text-[0.84rem] leading-relaxed text-[var(--text-muted)]">{data.domain.message}</p>
              ) : null}

              {data.instructions ? (
                <div className="mt-4">
                  <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    DNS records to add
                  </p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-[0.84rem]">
                      <thead>
                        <tr className="text-left text-[var(--text-muted)]">
                          <th className="py-1.5 pr-3 font-medium">Type</th>
                          <th className="py-1.5 pr-3 font-medium">Name</th>
                          <th className="py-1.5 pr-3 font-medium">Value</th>
                          <th className="py-1.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {data.instructions.records.map((record) => (
                          <tr key={`${record.type}-${record.name}`} className="border-t border-[var(--line)]">
                            <td className="py-2 pr-3 font-semibold">{record.type}</td>
                            <td className="py-2 pr-3 font-mono text-[0.8rem]">{record.name}</td>
                            <td className="py-2 pr-3 font-mono text-[0.8rem]">{record.value}</td>
                            <td className="py-2">
                              <CopyButton value={record.value} label="Copy" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-5">
          <div className="surface p-5">
            <h2 className="text-[1rem] font-semibold">Setup requirements</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">
              {(data?.setupRequirements ?? []).map((requirement) => (
                <li key={requirement} className="flex gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  {requirement}
                </li>
              ))}
            </ul>
            {busy === 'connect' ? <Loader2 className="mt-4 h-4 w-4 animate-spin text-[var(--text-muted)]" /> : null}
          </div>

          <div className="surface p-5">
            <h2 className="text-[1rem] font-semibold">Current addresses</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {websites.map((website) => (
                <li key={website.id} className="rounded-xl border border-[var(--line)] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[0.9rem] font-medium">{website.name}</p>
                    {website.domain ? <DomainStatus status={website.domain.status} /> : <Badge tone="neutral">No domain</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="rounded-lg bg-[var(--surface)] px-2 py-1 text-[0.78rem]">/s/{website.slug}</code>
                    {website.domain ? (
                      <code className="rounded-lg bg-[var(--surface)] px-2 py-1 text-[0.78rem]">{website.domain.hostname}</code>
                    ) : null}
                    <CopyButton value={`${typeof window !== 'undefined' ? window.location.origin : ''}/s/${website.slug}`} label="Copy link" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-5">
            <h2 className="text-[1rem] font-semibold">Where domains are managed</h2>
            <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--text-muted)]">
              Domain attachment uses the Vercel Domains API when <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">VERCEL_API_TOKEN</code>{' '}
              and <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">VERCEL_PROJECT_ID</code> are set. Without them, WEBORA
              still records the domain and returns the DNS records — you just add them yourself.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-[0.82rem] font-medium">
              {data?.providerConfigured ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Hosting API connected
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Hosting API not configured — manual DNS mode
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function DomainStatus({ status }: { status: string }) {
  const map: Record<string, { tone: 'success' | 'warn' | 'neutral'; label: string }> = {
    active: { tone: 'success', label: 'Active' },
    pending: { tone: 'warn', label: 'Pending DNS' },
    unverified: { tone: 'warn', label: 'Unverified' },
    error: { tone: 'warn', label: 'Needs attention' },
  };
  const entry = map[status] ?? map.pending;
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
