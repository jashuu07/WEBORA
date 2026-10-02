import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsEvent, AnalyticsSummary, Asset, DomainRecord, Page, UserRecord, Website } from '@/types';
import type { DbShape, Store } from './types';
import { summarise } from './local';

/**
 * Supabase driver — PostgreSQL storage for production.
 *
 * Uses Supabase as managed Postgres (service-role key, server-side only).
 * The schema is normalised (websites → pages → sections, plus assets, domains,
 * analytics_events, enquiries) and lives in `database/migrations`.
 *
 * Auth stays in the app layer (bcrypt + signed cookie) so both drivers behave
 * identically; `docs/AUTH.md` covers swapping in Supabase Auth instead.
 */

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'STORAGE_DRIVER=supabase requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
        'See .env.example and docs/DEPLOYMENT.md.',
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function supabaseReady(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/* -------------------------------------------------------------------------- */
/*  Mappers: normalised rows ⇄ domain objects                                 */
/* -------------------------------------------------------------------------- */

function rowToPage(row: Record<string, unknown>, sections: Record<string, unknown>[] = []): Page {
  return {
    id: row.id as string,
    websiteId: row.website_id as string,
    title: row.title as string,
    slug: row.slug as string,
    inNav: Boolean(row.in_nav),
    seo: (row.seo ?? {}) as Page['seo'],
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
    sections: sections
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
      .map((s) => ({
        id: s.id as string,
        type: s.type as Page['sections'][number]['type'],
        variant: (s.variant as string) ?? undefined,
        visible: Boolean(s.visible),
        label: (s.label as string) ?? '',
        spacing: (s.spacing ?? {}) as Page['sections'][number]['spacing'],
        props: (s.props ?? {}) as Record<string, unknown>,
      })),
  };
}

function rowToWebsite(row: Record<string, unknown>, pages: Page[], domain?: DomainRecord): Website {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    status: row.status as Website['status'],
    slug: row.slug as string,
    industry: row.industry as Website['industry'],
    styleId: row.style_id as Website['styleId'],
    tokens: row.tokens as Website['tokens'],
    business: row.business as Website['business'],
    settings: (row.settings ?? {}) as Website['settings'],
    pages,
    seo: (row.seo ?? {}) as Website['seo'],
    templateId: (row.template_id as string) ?? '',
    thumbnail: (row.thumbnail as string) ?? undefined,
    domain,
    publishedAt: (row.published_at as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    generation: (row.generation ?? {
      engine: 'local',
      templateId: '',
      generatedAt: new Date().toISOString(),
      stages: [],
    }) as Website['generation'],
  };
}

/* -------------------------------------------------------------------------- */
/*  Store implementation                                                      */
/* -------------------------------------------------------------------------- */

export function createSupabaseStore(): Store {
  const sb = () => supabase();

  async function loadWebsite(id: string): Promise<Website | null> {
    const { data: row, error } = await sb().from('websites').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!row) return null;

    const [{ data: pageRows }, { data: sectionRows }, { data: domainRow }] = await Promise.all([
      sb().from('pages').select('*').eq('website_id', id).order('position'),
      sb().from('sections').select('*').eq('website_id', id),
      sb().from('domains').select('*').eq('website_id', id).maybeSingle(),
    ]);

    const pages = (pageRows ?? []).map((p) =>
      rowToPage(p as Record<string, unknown>, (sectionRows ?? []).filter((s) => (s as { page_id: string }).page_id === (p as { id: string }).id) as Record<string, unknown>[]),
    );

    return rowToWebsite(row as Record<string, unknown>, pages, domainRow ? rowToDomain(domainRow as Record<string, unknown>) : undefined);
  }

  function rowToDomain(row: Record<string, unknown>): DomainRecord {
    return {
      id: row.id as string,
      websiteId: row.website_id as string,
      hostname: row.hostname as string,
      status: row.status as DomainRecord['status'],
      dnsRecords: (row.dns_records ?? []) as DomainRecord['dnsRecords'],
      provider: (row.provider as DomainRecord['provider']) ?? 'manual',
      verifiedAt: (row.verified_at as string) ?? undefined,
      lastCheckedAt: (row.last_checked_at as string) ?? undefined,
      message: (row.message as string) ?? undefined,
    };
  }

  async function saveWebsite(website: Website): Promise<Website> {
    const s = sb();
    const { error: wErr } = await s.from('websites').upsert({
      id: website.id,
      user_id: website.userId,
      name: website.name,
      status: website.status,
      slug: website.slug,
      industry: website.industry,
      style_id: website.styleId,
      tokens: website.tokens,
      business: website.business,
      settings: website.settings,
      seo: website.seo,
      template_id: website.templateId,
      thumbnail: website.thumbnail ?? null,
      published_at: website.publishedAt ?? null,
      created_at: website.createdAt,
      updated_at: website.updatedAt,
      generation: website.generation,
    });
    if (wErr) throw wErr;

    for (const [index, page] of website.pages.entries()) {
      const { error: pErr } = await s.from('pages').upsert({
        id: page.id,
        website_id: website.id,
        title: page.title,
        slug: page.slug,
        in_nav: page.inNav,
        seo: page.seo,
        position: index,
        updated_at: page.updatedAt,
      });
      if (pErr) throw pErr;

      await s.from('sections').delete().eq('page_id', page.id);
      if (page.sections.length) {
        const { error: sErr } = await s.from('sections').insert(
          page.sections.map((section, position) => ({
            id: section.id,
            page_id: page.id,
            website_id: website.id,
            type: section.type,
            variant: section.variant ?? null,
            visible: section.visible,
            label: section.label,
            spacing: section.spacing,
            props: section.props,
            position,
          })),
        );
        if (sErr) throw sErr;
      }
    }

    if (website.domain) {
      await s.from('domains').upsert({
        id: website.domain.id,
        website_id: website.id,
        hostname: website.domain.hostname,
        status: website.domain.status,
        dns_records: website.domain.dnsRecords,
        provider: website.domain.provider,
        verified_at: website.domain.verifiedAt ?? null,
        last_checked_at: website.domain.lastCheckedAt ?? null,
        message: website.domain.message ?? null,
      });
    }

    return website;
  }

  return {
    driver: 'supabase',

    findUserByEmail: async (email) => {
      const { data } = await sb().from('users').select('*').ilike('email', email).maybeSingle();
      return (data as UserRecord) ?? null;
    },

    findUserById: async (userId) => {
      const { data } = await sb().from('users').select('*').eq('id', userId).maybeSingle();
      return (data as UserRecord) ?? null;
    },

    createUser: async (user) => {
      const { error } = await sb().from('users').insert(user);
      if (error) throw error;
      return user;
    },

    updateUser: async (userId, patch) => {
      const { data, error } = await sb().from('users').update(patch).eq('id', userId).select('*').maybeSingle();
      if (error) throw error;
      return (data as UserRecord) ?? null;
    },

    findUserByResetToken: async (token) => {
      const { data } = await sb()
        .from('users')
        .select('*')
        .eq('reset_token', token)
        .gt('reset_token_expires_at', new Date().toISOString())
        .maybeSingle();
      return (data as UserRecord) ?? null;
    },

    countWebsites: async (userId) => {
      const { count } = await sb().from('websites').select('id', { count: 'exact', head: true }).eq('user_id', userId);
      return count ?? 0;
    },

    listWebsites: async (userId) => {
      const { data } = await sb().from('websites').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
      const sites = await Promise.all((data ?? []).map((r) => loadWebsite((r as { id: string }).id)));
      return sites.filter(Boolean) as Website[];
    },

    getWebsite: loadWebsite,

    getWebsiteBySlug: async (slug) => {
      const { data } = await sb().from('websites').select('id').eq('slug', slug).maybeSingle();
      return data ? loadWebsite((data as { id: string }).id) : null;
    },

    getWebsiteByDomain: async (hostname) => {
      const { data } = await sb().from('domains').select('website_id').ilike('hostname', hostname).maybeSingle();
      if (!data) return null;
      return loadWebsite((data as { website_id: string }).website_id);
    },

    listPublishedSites: async () => {
      const { data } = await sb()
        .from('websites')
        .select('id, slug, name, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });
      const rows = (data ?? []) as { id: string; slug: string; name: string; updated_at: string }[];
      if (!rows.length) return [];
      const { data: pageRows } = await sb()
        .from('pages')
        .select('website_id, slug, updated_at')
        .in('website_id', rows.map((r) => r.id));
      const byWebsite = new Map<string, { slug: string; updatedAt: string }[]>();
      for (const pg of (pageRows ?? []) as { website_id: string; slug: string; updated_at: string }[]) {
        const list = byWebsite.get(pg.website_id) ?? [];
        list.push({ slug: pg.slug, updatedAt: pg.updated_at });
        byWebsite.set(pg.website_id, list);
      }
      return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        updatedAt: r.updated_at,
        pages: byWebsite.get(r.id) ?? [],
      }));
    },

    slugTaken: async (slug, exceptId) => {
      const { data } = await sb().from('websites').select('id').eq('slug', slug);
      return (data ?? []).some((r) => (r as { id: string }).id !== exceptId);
    },

    createWebsite: saveWebsite,

    updateWebsite: async (id, patch) => {
      const existing = await loadWebsite(id);
      if (!existing) return null;
      const merged: Website = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      await saveWebsite(merged);
      return merged;
    },

    deleteWebsite: async (id) => {
      const s = sb();
      await s.from('sections').delete().eq('website_id', id);
      await s.from('pages').delete().eq('website_id', id);
      await s.from('domains').delete().eq('website_id', id);
      await s.from('analytics_events').delete().eq('website_id', id);
      await s.from('enquiries').delete().eq('website_id', id);
      const { error } = await s.from('websites').delete().eq('id', id);
      return !error;
    },

    duplicateWebsite: async (id, userId) => {
      const source = await loadWebsite(id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: Website = {
        ...structuredClone(source),
        id: `site_${Math.random().toString(36).slice(2, 10)}`,
        userId,
        name: `${source.name} (copy)`,
        slug: `${source.slug}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'draft',
        publishedAt: undefined,
        domain: undefined,
        createdAt: now,
        updatedAt: now,
      };
      copy.pages = copy.pages.map((p) => ({
        ...p,
        id: `page_${Math.random().toString(36).slice(2, 10)}`,
        websiteId: copy.id,
        sections: p.sections.map((s) => ({ ...s, id: `${s.type}_${Math.random().toString(36).slice(2, 10)}` })),
      }));
      return saveWebsite(copy);
    },

    listDomains: async (userId) => {
      const { data } = await sb()
        .from('domains')
        .select('*, websites!inner(user_id)')
        .eq('websites.user_id', userId);
      return (data ?? []).map((r) => rowToDomain(r as Record<string, unknown>));
    },

    upsertDomain: async (websiteId, domain) => {
      const record: DomainRecord = {
        id: domain.id ?? `dom_${Math.random().toString(36).slice(2, 10)}`,
        websiteId,
        hostname: domain.hostname,
        status: domain.status,
        dnsRecords: domain.dnsRecords,
        provider: domain.provider,
        verifiedAt: domain.verifiedAt,
        lastCheckedAt: domain.lastCheckedAt,
        message: domain.message,
      };
      const { error } = await sb().from('domains').upsert({
        id: record.id,
        website_id: websiteId,
        hostname: record.hostname,
        status: record.status,
        dns_records: record.dnsRecords,
        provider: record.provider,
        verified_at: record.verifiedAt ?? null,
        last_checked_at: record.lastCheckedAt ?? null,
        message: record.message ?? null,
      });
      if (error) throw error;
      return record;
    },

    removeDomain: async (websiteId) => {
      const { error } = await sb().from('domains').delete().eq('website_id', websiteId);
      return !error;
    },

    listAssets: async (userId) => {
      const { data } = await sb().from('assets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (data ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          userId: row.user_id as string,
          websiteId: (row.website_id as string) ?? undefined,
          name: row.name as string,
          mime: row.mime as string,
          size: Number(row.size ?? 0),
          url: row.url as string,
          createdAt: row.created_at as string,
        } satisfies Asset;
      });
    },

    createAsset: async (asset) => {
      const { error } = await sb().from('assets').insert({
        id: asset.id,
        user_id: asset.userId,
        website_id: asset.websiteId ?? null,
        name: asset.name,
        mime: asset.mime,
        size: asset.size,
        url: asset.url,
        created_at: asset.createdAt,
      });
      if (error) throw error;
      return asset;
    },

    recordEvent: async (event: AnalyticsEvent) => {
      await sb().from('analytics_events').insert({
        id: event.id,
        website_id: event.websiteId,
        page_id: event.pageId ?? null,
        path: event.path,
        type: event.type,
        referrer: event.referrer ?? null,
        device: event.device,
        country: event.country ?? null,
        created_at: event.createdAt,
      });
    },

    getAnalytics: async (websiteId, days = 30): Promise<AnalyticsSummary> => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data } = await sb()
        .from('analytics_events')
        .select('*')
        .eq('website_id', websiteId)
        .gte('created_at', since);
      const events: AnalyticsEvent[] = (data ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          websiteId: row.website_id as string,
          pageId: (row.page_id as string) ?? undefined,
          path: row.path as string,
          type: 'pageview',
          referrer: (row.referrer as string) ?? undefined,
          device: row.device as AnalyticsEvent['device'],
          country: (row.country as string) ?? undefined,
          createdAt: row.created_at as string,
        };
      });
      return summarise(events, websiteId, days);
    },

    createEnquiry: async (enquiry) => {
      const { error } = await sb().from('enquiries').insert({
        id: enquiry.id,
        website_id: enquiry.websiteId,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone ?? null,
        message: enquiry.message,
        read: enquiry.read,
        created_at: enquiry.createdAt,
      });
      if (error) throw error;
      return enquiry;
    },

    listEnquiries: async (websiteId) => {
      const { data } = await sb().from('enquiries').select('*').eq('website_id', websiteId).order('created_at', { ascending: false });
      return (data ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          websiteId: row.website_id as string,
          name: row.name as string,
          email: row.email as string,
          phone: (row.phone as string) ?? undefined,
          message: row.message as string,
          read: Boolean(row.read),
          createdAt: row.created_at as string,
        };
      });
    },

    markEnquiryRead: async (enquiryId, isRead) => {
      await sb().from('enquiries').update({ read: isRead }).eq('id', enquiryId);
    },
  };
}

/** Helper used by the seed script / migration checks. */
export function supabaseConfigSummary(): { url: string; configured: boolean } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return { url, configured: supabaseReady() };
}

export type { DbShape };
