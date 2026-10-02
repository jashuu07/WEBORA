import type {
  AnalyticsEvent,
  AnalyticsSummary,
  Asset,
  DomainRecord,
  UserRecord,
  Website,
} from '@/types';

/** Lightweight reference to a live website, for the sitemap. */
export interface PublishedSiteRef {
  slug: string;
  name: string;
  updatedAt: string;
  pages: { slug: string; updatedAt: string }[];
}

/** A contact-form submission captured from a published site. */
export interface Enquiry {
  id: string;
  websiteId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DbShape {
  users: UserRecord[];
  websites: Website[];
  domains: DomainRecord[];
  assets: Asset[];
  analytics: AnalyticsEvent[];
  enquiries: Enquiry[];
  meta: { version: number; updatedAt: string };
}

/**
 * Storage contract.
 *
 * Two drivers implement it:
 *   - `local.ts`     → file-backed JSON store (zero config, used in dev/demo)
 *   - `supabase.ts`  → PostgreSQL via Supabase (see database/migrations)
 *
 * Selected with the STORAGE_DRIVER env var. All app code depends on this
 * interface only, so switching drivers requires no changes above this layer.
 */
export interface Store {
  readonly driver: 'local' | 'supabase';

  /* users */
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createUser(user: UserRecord): Promise<UserRecord>;
  updateUser(id: string, patch: Partial<UserRecord>): Promise<UserRecord | null>;
  findUserByResetToken(token: string): Promise<UserRecord | null>;
  countWebsites(userId: string): Promise<number>;

  /* websites */
  listWebsites(userId: string): Promise<Website[]>;
  getWebsite(id: string): Promise<Website | null>;
  getWebsiteBySlug(slug: string): Promise<Website | null>;
  getWebsiteByDomain(hostname: string): Promise<Website | null>;
  createWebsite(website: Website): Promise<Website>;
  updateWebsite(id: string, patch: Partial<Website>): Promise<Website | null>;
  deleteWebsite(id: string): Promise<boolean>;
  duplicateWebsite(id: string, userId: string): Promise<Website | null>;
  slugTaken(slug: string, exceptId?: string): Promise<boolean>;

  /**
   * Published websites only, in a deliberately light shape — used to build
   * /sitemap.xml without loading every section of every site.
   */
  listPublishedSites(): Promise<PublishedSiteRef[]>;

  /* domains */
  listDomains(userId: string): Promise<DomainRecord[]>;
  upsertDomain(websiteId: string, domain: Omit<DomainRecord, 'id' | 'websiteId'> & Partial<Pick<DomainRecord, 'id'>>): Promise<DomainRecord>;
  removeDomain(websiteId: string): Promise<boolean>;

  /* assets */
  listAssets(userId: string): Promise<Asset[]>;
  createAsset(asset: Asset): Promise<Asset>;

  /* analytics */
  recordEvent(event: AnalyticsEvent): Promise<void>;
  getAnalytics(websiteId: string, days?: number): Promise<AnalyticsSummary>;

  /* enquiries */
  createEnquiry(enquiry: Enquiry): Promise<Enquiry>;
  listEnquiries(websiteId: string): Promise<Enquiry[]>;
  markEnquiryRead(id: string, read: boolean): Promise<void>;
}

export const DB_VERSION = 1;

export function emptyDb(): DbShape {
  return {
    users: [],
    websites: [],
    domains: [],
    assets: [],
    analytics: [],
    enquiries: [],
    meta: { version: DB_VERSION, updatedAt: new Date().toISOString() },
  };
}
