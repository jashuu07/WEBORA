import { createLocalStore } from './local';
import { createSupabaseStore, supabaseReady } from './supabase';
import type { Store } from './types';

/**
 * Driver selection.
 *
 *   STORAGE_DRIVER=local      → file-backed JSON (default, zero config)
 *   STORAGE_DRIVER=supabase   → PostgreSQL via Supabase
 *
 * If `supabase` is requested without credentials, WEBORA falls back to the
 * local driver and reports that in `storageStatus()` so the UI can tell the
 * user exactly what is configured instead of failing silently.
 */

declare global {
  // eslint-disable-next-line no-var
  var __weboraStore: Store | undefined;
}

export function getStore(): Store {
  if (globalThis.__weboraStore) return globalThis.__weboraStore;

  const requested = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  const useSupabase = requested === 'supabase' && supabaseReady();

  globalThis.__weboraStore = useSupabase ? createSupabaseStore() : createLocalStore();
  return globalThis.__weboraStore;
}

export function storageStatus() {
  const requested = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  const active = requested === 'supabase' && supabaseReady() ? 'supabase' : 'local';
  return {
    requested,
    active: active as 'local' | 'supabase',
    fallback: requested === 'supabase' && active === 'local',
    detail:
      active === 'supabase'
        ? 'Connected to Supabase Postgres. Data persists in your project.'
        : requested === 'supabase'
          ? 'STORAGE_DRIVER=supabase but credentials are missing — running on the local JSON store.'
          : 'Local JSON store at .data/webora.json. Set STORAGE_DRIVER=supabase for Postgres.',
  };
}

export type { Store };
export * from './types';
