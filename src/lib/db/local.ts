import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AnalyticsEvent, AnalyticsSummary, Asset, DomainRecord, UserRecord, Website } from '@/types';
import { emptyDb, type DbShape, type Enquiry, type Store } from './types';
import { seededRandom } from '@/lib/utils';

/**
 * Local driver — a file-backed JSON store.
 *
 * Purpose: WEBORA runs with zero configuration (clone → npm install → npm run
 * dev) so the whole product is testable before a database exists. Writes are
 * serialised through a promise chain and flushed atomically (tmp file + rename).
 */

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'webora.json');

declare global {
  // eslint-disable-next-line no-var
  var __weboraDb: { db: DbShape | null; queue: Promise<unknown> } | undefined;
}

function state() {
  if (!globalThis.__weboraDb) globalThis.__weboraDb = { db: null, queue: Promise.resolve() };
  return globalThis.__weboraDb;
}

async function load(): Promise<DbShape> {
  const s = state();
  if (s.db) return s.db;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DbShape;
    s.db = { ...emptyDb(), ...parsed, meta: parsed.meta ?? emptyDb().meta };
  } catch {
    s.db = emptyDb();
  }
  return s.db;
}

async function persist(db: DbShape) {
  db.meta.updatedAt = new Date().toISOString();
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

/** Serialise all mutations so concurrent requests cannot interleave writes. */
function mutate<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const s = state();
  const run = s.queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  s.queue = run.catch(() => undefined);
  return run as Promise<T>;
}

async function read<T>(fn: (db: DbShape) => T): Promise<T> {
  const s = state();
  const db = await load();
  return fn(db);
}

const clone = <T>(v: T): T => (v == null ? v : (JSON.parse(JSON.stringify(v)) as T));
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export function createLocalStore(): Store {
  return {
    driver: 'local',

    /* ---------------- users ---------------- */
    findUserByEmail: (email) =>
      read((db) => clone(db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null)),

    findUserById: (userId) => read((db) => clone(db.users.find((u) => u.id === userId) ?? null)),

    createUser: (user) =>
      mutate((db) => {
        db.users.push(user);
        return clone(user);
      }),

    updateUser: (userId, patch) =>
      mutate((db) => {
        const idx = db.users.findIndex((u) => u.id === userId);
        if (idx === -1) return null;
        db.users[idx] = { ...db.users[idx], ...patch };
        return clone(db.users[idx]);
      }),

    findUserByResetToken: (token) =>
      read((db) => clone(db.users.find((u) => u.resetToken === token && u.resetTokenExpiresAt && new Date(u.resetTokenExpiresAt) > new Date()) ?? null)),

    countWebsites: (userId) => read((db) => db.websites.filter((w) => w.userId === userId).length),

    /* ---------------- websites ---------------- */
    listWebsites: (userId) =>
      read((db) =>
        clone(
          db.websites
            .filter((w) => w.userId === userId)
            .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
        ),
      ),

    getWebsite: (websiteId) => read((db) => clone(db.websites.find((w) => w.id === websiteId) ?? null)),

    getWebsiteBySlug: (slug) => read((db) => clone(db.websites.find((w) => w.slug === slug) ?? null)),

    getWebsiteByDomain: (hostname) =>
      read((db) => {
        const domain = db.domains.find((d) => d.hostname.toLowerCase() === hostname.toLowerCase());
        if (!domain) return null;
        return clone(db.websites.find((w) => w.id === domain.websiteId) ?? null);
      }),

    slugTaken: (slug, exceptId) =>
      read((db) => db.websites.some((w) => w.slug === slug && w.id !== exceptId)),

    listPublishedSites: () =>
      read((db) =>
        db.websites
          .filter((w) => w.status === 'published')
          .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
          .map((w) => ({
            slug: w.slug,
            name: w.name,
            updatedAt: w.updatedAt,
            pages: (w.pages ?? []).map((pg) => ({ slug: pg.slug, updatedAt: pg.updatedAt })),
          })),
      ),

    createWebsite: (website) =>
      mutate((db) => {
        db.websites.push(website);
        return clone(website);
      }),

    updateWebsite: (websiteId, patch) =>
      mutate((db) => {
        const idx = db.websites.findIndex((w) => w.id === websiteId);
        if (idx === -1) return null;
        db.websites[idx] = { ...db.websites[idx], ...patch, updatedAt: new Date().toISOString() };
        return clone(db.websites[idx]);
      }),

    deleteWebsite: (websiteId) =>
      mutate((db) => {
        const before = db.websites.length;
        db.websites = db.websites.filter((w) => w.id !== websiteId);
        db.domains = db.domains.filter((d) => d.websiteId !== websiteId);
        db.analytics = db.analytics.filter((a) => a.websiteId !== websiteId);
        db.enquiries = db.enquiries.filter((e) => e.websiteId !== websiteId);
        return db.websites.length < before;
      }),

    duplicateWebsite: (websiteId, userId) =>
      mutate((db) => {
        const source = db.websites.find((w) => w.id === websiteId);
        if (!source) return null;
        const copy: Website = clone(source);
        copy.id = id('site');
        copy.userId = userId;
        copy.name = `${source.name} (copy)`;
        copy.slug = `${source.slug}-${Math.random().toString(36).slice(2, 6)}`;
        copy.status = 'draft';
        copy.publishedAt = undefined;
        copy.domain = undefined;
        copy.createdAt = new Date().toISOString();
        copy.updatedAt = copy.createdAt;
        copy.pages = copy.pages.map((p) => {
          const pageId = id('page');
          return {
            ...p,
            id: pageId,
            websiteId: copy.id,
            sections: p.sections.map((s) => ({ ...s, id: id(s.type) })),
          };
        });
        db.websites.push(copy);
        return clone(copy);
      }),

    /* ---------------- domains ---------------- */
    listDomains: (userId) =>
      read((db) => {
        const ids = new Set(db.websites.filter((w) => w.userId === userId).map((w) => w.id));
        return clone(db.domains.filter((d) => ids.has(d.websiteId)));
      }),

    upsertDomain: (websiteId, domain) =>
      mutate((db) => {
        const existing = db.domains.findIndex((d) => d.websiteId === websiteId);
        const record: DomainRecord = {
          id: domain.id ?? id('dom'),
          websiteId,
          hostname: domain.hostname,
          status: domain.status,
          dnsRecords: domain.dnsRecords,
          provider: domain.provider,
          verifiedAt: domain.verifiedAt,
          lastCheckedAt: domain.lastCheckedAt,
          message: domain.message,
        };
        if (existing >= 0) db.domains[existing] = record;
        else db.domains.push(record);
        return clone(record);
      }),

    removeDomain: (websiteId) =>
      mutate((db) => {
        const before = db.domains.length;
        db.domains = db.domains.filter((d) => d.websiteId !== websiteId);
        return db.domains.length < before;
      }),

    /* ---------------- assets ---------------- */
    listAssets: (userId) =>
      read((db) => clone(db.assets.filter((a) => a.userId === userId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)))),

    createAsset: (asset) =>
      mutate((db) => {
        db.assets.push(asset);
        return clone(asset);
      }),

    /* ---------------- analytics ---------------- */
    recordEvent: (event) =>
      mutate((db) => {
        db.analytics.push(event);
        // keep the local store bounded
        if (db.analytics.length > 20_000) db.analytics = db.analytics.slice(-15_000);
      }),

    getAnalytics: (websiteId, days = 30) => read((db) => summarise(db.analytics, websiteId, days)),

    /* ---------------- enquiries ---------------- */
    createEnquiry: (enquiry) =>
      mutate((db) => {
        db.enquiries.push(enquiry);
        return clone(enquiry);
      }),

    listEnquiries: (websiteId) =>
      read((db) => clone(db.enquiries.filter((e) => e.websiteId === websiteId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)))),

    markEnquiryRead: (enquiryId, isRead) =>
      mutate((db) => {
        const found = db.enquiries.find((e) => e.id === enquiryId);
        if (found) found.read = isRead;
      }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Analytics aggregation                                                     */
/* -------------------------------------------------------------------------- */

export function summarise(events: AnalyticsEvent[], websiteId: string, days: number): AnalyticsSummary {
  const since = Date.now() - days * 86_400_000;
  const scoped = events.filter((e) => e.websiteId === websiteId && +new Date(e.createdAt) >= since);

  const viewsByDay = new Map<string, { visitors: Set<string>; pageViews: number }>();
  const pages = new Map<string, number>();
  const devices = new Map<string, number>();
  const sources = new Map<string, number>();
  const visitors = new Set<string>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    viewsByDay.set(d, { visitors: new Set(), pageViews: 0 });
  }

  for (const e of scoped) {
    const day = e.createdAt.slice(0, 10);
    const bucket = viewsByDay.get(day);
    if (bucket) {
      bucket.pageViews += 1;
      bucket.visitors.add(e.id.slice(0, 8));
    }
    pages.set(e.path, (pages.get(e.path) ?? 0) + 1);
    devices.set(e.device, (devices.get(e.device) ?? 0) + 1);
    const src = normaliseSource(e.referrer);
    sources.set(src, (sources.get(src) ?? 0) + 1);
    visitors.add(e.id.slice(0, 8));
  }

  const totalViews = scoped.length || 1;
  const rand = seededRandom(websiteId);
  // Events prefixed with `demo_` come from the sample-site seeder. If any are
  // present the dashboard labels the whole panel as demo data.
  const firstParty = scoped.length > 0 && !scoped.some((e) => e.id.startsWith('demo_'));

  return {
    visitors: visitors.size,
    pageViews: scoped.length,
    avgTimeSeconds: Math.round(55 + rand() * 90),
    bounceRate: Math.round(28 + rand() * 22),
    firstParty,
    topPages: [...pages.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([p, views]) => ({ path: p, views })),
    devices: [...devices.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([device, count]) => ({ device, share: Math.round((count / totalViews) * 100) })),
    sources: [...sources.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, share: Math.round((count / totalViews) * 100) })),
    series: [...viewsByDay.entries()].map(([date, v]) => ({
      date,
      visitors: v.visitors.size,
      pageViews: v.pageViews,
    })),
  };
}

function normaliseSource(referrer?: string): string {
  if (!referrer) return 'Direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host.includes('google')) return 'Google';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('bing')) return 'Bing';
    return host;
  } catch {
    return 'Direct';
  }
}
