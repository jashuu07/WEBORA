'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, ExternalLink, Info, Loader2, Monitor, Smartphone, Tablet, TrendingUp } from 'lucide-react';
import type { AnalyticsSummary, Website } from '@/types';
import { Badge, EmptyState, Skeleton } from '@/components/ui/primitives';
import { ButtonLink } from '@/components/ui/Button';
import { cn, compactNumber } from '@/lib/utils';
import { StatusChip } from '@/components/ui/primitives';

interface ApiResponse {
  summary: AnalyticsSummary;
  days: number;
  published: boolean;
  empty: boolean;
  emptyReason: string;
  tracking: { mode: string; note: string };
}

export function AnalyticsPanel({ websites }: { websites: Website[] }) {
  const [siteId, setSiteId] = useState(websites[0]?.id ?? '');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (id: string, window: number) => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/sites/${id}/analytics?days=${window}`);
        const json = await res.json();
        if (json.ok) setData(json.data);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(siteId, days);
  }, [siteId, days, load]);

  if (!websites.length) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" />}
        title="No websites to analyse yet"
        description="Create a website first — analytics start recording as soon as it is published and people visit."
        action={<ButtonLink href="/create">Create a website</ButtonLink>}
      />
    );
  }

  const site = websites.find((w) => w.id === siteId) ?? websites[0];
  const summary = data?.summary;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="select max-w-[260px]"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          aria-label="Choose a website"
        >
          {websites.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white p-1">
          {[7, 30, 90].map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[0.82rem] font-medium transition',
                days === window ? 'bg-[var(--surface-ink)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {window}d
            </button>
          ))}
        </div>

        <StatusChip status={site.status} />

        <ButtonLink
          href={`/s/${site.slug}`}
          target="_blank"
          variant="ghost"
          size="sm"
          icon={<ExternalLink className="h-3.5 w-3.5" />}
        >
          Open site
        </ButtonLink>

        <div className="ml-auto flex items-center gap-2">
          {summary && !summary.firstParty && summary.pageViews > 0 ? <Badge tone="warn">Demo data</Badge> : null}
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" /> : null}
        </div>
      </div>

      {loading && !summary ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : null}

      {summary && data ? (
        data.empty ? (
          <div className="mt-6">
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="No visits recorded yet"
              description={data.emptyReason}
              action={
                site.status === 'published' ? (
                  <ButtonLink href={`/s/${site.slug}`} target="_blank" variant="outline">
                    Open the live site
                  </ButtonLink>
                ) : (
                  <ButtonLink href={`/editor/${site.id}`}>Publish this website</ButtonLink>
                )
              }
            />
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Visitors" value={compactNumber(summary.visitors)} sub={`${days} days`} />
              <Metric label="Page views" value={compactNumber(summary.pageViews)} sub={`${(summary.pageViews / Math.max(1, summary.visitors)).toFixed(1)} per visitor`} />
              <Metric label="Avg. time on site" value={`${Math.floor(summary.avgTimeSeconds / 60)}m ${summary.avgTimeSeconds % 60}s`} sub="estimate" />
              <Metric label="Bounce rate" value={`${summary.bounceRate}%`} sub="single-page visits" />
            </section>

            <section className="mt-5 surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[0.95rem] font-semibold">Traffic over the last {days} days</h2>
                <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-[var(--text-muted)]">
                  <Info className="h-3.5 w-3.5" />
                  {data.tracking.note}
                </span>
              </div>
              <TrafficChart series={summary.series} />
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <section className="surface p-5">
                <h2 className="text-[0.95rem] font-semibold">Top pages</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {summary.topPages.map((page) => {
                    const max = summary.topPages[0]?.views || 1;
                    return (
                      <li key={page.path}>
                        <div className="flex items-baseline justify-between gap-3 text-[0.85rem]">
                          <span className="font-medium">{page.path}</span>
                          <span className="tabular-nums text-[var(--text-muted)]">{page.views}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eeece8]">
                          <div
                            className="h-full rounded-full bg-[var(--accent)]"
                            style={{ width: `${Math.round((page.views / max) * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="flex flex-col gap-5">
                <section className="surface p-5">
                  <h2 className="text-[0.95rem] font-semibold">Devices</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {summary.devices.map((device) => (
                      <li key={device.device} className="flex items-center gap-3">
                        <DeviceIcon device={device.device} />
                        <span className="flex-1 text-[0.86rem] capitalize">{device.device}</span>
                        <span className="text-[0.86rem] font-semibold tabular-nums">{device.share}%</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="surface p-5">
                  <h2 className="text-[0.95rem] font-semibold">Traffic sources</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {summary.sources.map((source) => (
                      <li key={source.source} className="flex items-center gap-3">
                        <span className="flex-1 truncate text-[0.86rem]">{source.source}</span>
                        <span className="text-[0.86rem] font-semibold tabular-nums">{source.share}%</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </>
        )
      ) : null}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="surface p-5">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2.5 font-display text-[1.9rem] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      {sub ? <p className="mt-2 text-[0.78rem] text-[var(--text-muted)]">{sub}</p> : null}
    </div>
  );
}

function DeviceIcon({ device }: { device: string }) {
  const Icon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-muted)]">
      <Icon className="h-4 w-4" />
    </span>
  );
}

/** Lightweight SVG area + bar chart — no charting dependency. */
function TrafficChart({ series }: { series: AnalyticsSummary['series'] }) {
  if (!series.length) return null;

  const width = 760;
  const height = 200;
  const max = Math.max(1, ...series.map((point) => point.pageViews));
  const step = width / Math.max(1, series.length - 1);

  const points = series.map((point, index) => ({
    x: index * step,
    y: height - (point.pageViews / max) * (height - 24) - 6,
    ...point,
  }));

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[200px] w-full" role="img" aria-label="Page views over time">
        <defs>
          <linearGradient id="webora-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f26a1b" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f26a1b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={0}
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="#eeece8"
            strokeWidth={1}
          />
        ))}

        <path d={area} fill="url(#webora-area)" />
        <path d={line} fill="none" stroke="#f26a1b" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

        {points
          .filter((point) => point.pageViews > 0)
          .map((point) => (
            <circle key={point.date} cx={point.x} cy={point.y} r={2.6} fill="#fff" stroke="#f26a1b" strokeWidth={2} />
          ))}
      </svg>

      <div className="mt-2 flex justify-between text-[0.72rem] text-[var(--text-muted)]">
        <span>{new Date(series[0].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        <span>{new Date(series[series.length - 1].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
      </div>
    </div>
  );
}
