-- ============================================================================
-- WEBORA — initial schema (PostgreSQL / Supabase)
-- Run with: npm run db:migrate   (requires DATABASE_URL)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users
-- WEBORA keeps authentication in the app layer (bcrypt + signed cookie) so the
-- local and Supabase drivers behave identically. Swap to Supabase Auth by
-- following docs/AUTH.md — the column shape stays compatible.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id                      text primary key,
  email                   text not null unique,
  name                    text not null,
  plan                    text not null default 'free' check (plan in ('free','starter','pro')),
  avatar_color            text not null default '#F26A1B',
  company                 text,
  phone                   text,
  password_hash           text not null,
  reset_token             text,
  reset_token_expires_at  timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists users_reset_token_idx on public.users (reset_token);

-- ---------------------------------------------------------------------------
-- templates — the catalogue is code-defined (src/lib/templates/catalog.ts) and
-- mirrored here so analytics and recommendations can join against it.
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id            text primary key,
  name          text not null,
  industry      text not null,
  style_id      text not null,
  tagline       text,
  description   text,
  image         text,
  blueprint     jsonb not null default '[]'::jsonb,
  popularity    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- websites
-- ---------------------------------------------------------------------------
create table if not exists public.websites (
  id            text primary key,
  user_id       text not null references public.users (id) on delete cascade,
  name          text not null,
  status        text not null default 'draft' check (status in ('draft','published')),
  slug          text not null unique,
  industry      text not null default 'general',
  style_id      text not null default 'fresh-clean',
  template_id   text,
  tokens        jsonb not null default '{}'::jsonb,   -- design tokens
  business      jsonb not null default '{}'::jsonb,   -- business profile
  settings      jsonb not null default '{}'::jsonb,   -- website_settings
  seo           jsonb not null default '{}'::jsonb,
  generation    jsonb not null default '{}'::jsonb,   -- engine provenance
  thumbnail     text,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists websites_user_idx on public.websites (user_id, updated_at desc);
create index if not exists websites_status_idx on public.websites (status);

-- ---------------------------------------------------------------------------
-- pages
-- ---------------------------------------------------------------------------
create table if not exists public.pages (
  id          text primary key,
  website_id  text not null references public.websites (id) on delete cascade,
  title       text not null,
  slug        text not null,
  in_nav      boolean not null default true,
  seo         jsonb not null default '{}'::jsonb,
  position    int not null default 0,
  updated_at  timestamptz not null default now(),
  unique (website_id, slug)
);

create index if not exists pages_website_idx on public.pages (website_id, position);

-- ---------------------------------------------------------------------------
-- sections
-- ---------------------------------------------------------------------------
create table if not exists public.sections (
  id          text primary key,
  page_id     text not null references public.pages (id) on delete cascade,
  website_id  text not null references public.websites (id) on delete cascade,
  type        text not null,
  variant     text,
  visible     boolean not null default true,
  label       text,
  spacing     jsonb not null default '{}'::jsonb,
  props       jsonb not null default '{}'::jsonb,
  position    int not null default 0
);

create index if not exists sections_page_idx on public.sections (page_id, position);
create index if not exists sections_website_idx on public.sections (website_id);

-- ---------------------------------------------------------------------------
-- domains
-- ---------------------------------------------------------------------------
create table if not exists public.domains (
  id               text primary key,
  website_id       text not null references public.websites (id) on delete cascade,
  hostname         text not null unique,
  status           text not null default 'pending' check (status in ('unverified','pending','active','error')),
  dns_records      jsonb not null default '[]'::jsonb,
  provider         text not null default 'manual' check (provider in ('vercel','manual')),
  message          text,
  verified_at      timestamptz,
  last_checked_at  timestamptz
);

create index if not exists domains_website_idx on public.domains (website_id);

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
create table if not exists public.assets (
  id          text primary key,
  user_id     text not null references public.users (id) on delete cascade,
  website_id  text references public.websites (id) on delete set null,
  name        text not null,
  mime        text not null,
  size        bigint not null default 0,
  url         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists assets_user_idx on public.assets (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- analytics_events — first-party page views (no cookies, no personal data)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id          text primary key,
  website_id  text not null references public.websites (id) on delete cascade,
  page_id     text references public.pages (id) on delete set null,
  path        text not null,
  type        text not null default 'pageview',
  referrer    text,
  device      text not null default 'desktop' check (device in ('desktop','tablet','mobile')),
  country     text,
  created_at  timestamptz not null default now()
);

create index if not exists analytics_website_idx on public.analytics_events (website_id, created_at desc);

-- ---------------------------------------------------------------------------
-- enquiries — contact form submissions from published websites
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id          text primary key,
  website_id  text not null references public.websites (id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists enquiries_website_idx on public.enquiries (website_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists websites_touch on public.websites;
create trigger websites_touch before update on public.websites
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- The service-role key is used server-side only, so RLS is enabled to block
-- any anon-key access. Server routes bypass RLS by design.
-- ---------------------------------------------------------------------------
alter table public.users            enable row level security;
alter table public.websites         enable row level security;
alter table public.pages            enable row level security;
alter table public.sections         enable row level security;
alter table public.domains          enable row level security;
alter table public.assets           enable row level security;
alter table public.analytics_events enable row level security;
alter table public.enquiries        enable row level security;
alter table public.templates        enable row level security;

-- Published websites need to be readable by the public renderer. The renderer
-- uses the service-role key server-side, so no permissive policy is required.
