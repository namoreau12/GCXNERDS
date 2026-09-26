-- GCX launch data foundation
-- Run after supabase/gcx-auth-foundation.sql.
-- Keeps marketplace trading disabled while moving leads, waitlists, comments,
-- moderation reports, and sponsored placements toward Supabase-backed storage.

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed', 'bounced', 'suppressed')),
  source_page text,
  referrer text,
  consent_version text not null default 'gcx-launch-v1',
  interest_category text not null default 'daily-brief',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collector_waitlist (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  item text,
  intent text not null default 'Marketplace beta interest',
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'archived')),
  source_page text,
  referrer text,
  consent_version text not null default 'gcx-marketplace-beta-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_article_comments (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  story_id text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  author text not null,
  handle text,
  body text not null,
  status text not null default 'published' check (status in ('published', 'needs_review', 'hidden')),
  reports integer not null default 0 check (reports >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  category text,
  tags text[] not null default '{}',
  link_url text,
  image_url text,
  status text not null default 'published' check (status in ('published', 'needs_review', 'hidden')),
  reports integer not null default 0 check (reports >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  post_id uuid references public.community_posts(id) on delete cascade,
  local_post_id text,
  profile_id uuid references public.profiles(id) on delete set null,
  author text not null,
  handle text,
  body text not null,
  status text not null default 'published' check (status in ('published', 'needs_review', 'hidden')),
  reports integer not null default 0 check (reports >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('news_comment', 'community_post', 'community_comment', 'profile', 'listing_intent')),
  target_id text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.sponsor_leads (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  name text not null,
  email text not null,
  company text not null,
  package_interest text,
  budget_range text,
  goal text,
  source text,
  ref text,
  status text not null default 'new' check (status in ('new', 'contacted', 'proposal', 'won', 'lost', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsor_promotions (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  sponsor_name text not null,
  title text not null,
  body text,
  image_url text,
  destination_url text not null,
  placement text not null default 'community-feed',
  package_type text,
  cta_label text not null default 'Open sponsor offer',
  priority integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  clicks integer not null default 0 check (clicks >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_listing_intents (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  profile_id uuid references public.profiles(id) on delete set null,
  item_title text not null,
  item_type text not null default 'card',
  source_id text,
  intent text not null check (intent in ('buy', 'sell', 'trade', 'watch')),
  status text not null default 'waitlist' check (status in ('waitlist', 'reviewing', 'blocked', 'archived')),
  safety_note text not null default 'Marketplace beta only. No listing, payment, or trade is live.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions enable row level security;
alter table public.collector_waitlist enable row level security;
alter table public.news_article_comments enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.sponsor_leads enable row level security;
alter table public.sponsor_promotions enable row level security;
alter table public.marketplace_listing_intents enable row level security;

alter table public.news_article_comments add column if not exists local_id text;
alter table public.community_posts add column if not exists local_id text;
alter table public.community_comments add column if not exists local_id text;
alter table public.community_comments add column if not exists local_post_id text;
alter table public.sponsor_leads add column if not exists local_id text;
alter table public.sponsor_promotions add column if not exists local_id text;
alter table public.marketplace_listing_intents add column if not exists local_id text;
alter table public.marketplace_listing_intents add column if not exists source_id text;

grant select, insert, update, delete on table
  public.newsletter_subscriptions,
  public.collector_waitlist,
  public.news_article_comments,
  public.community_posts,
  public.community_comments,
  public.moderation_reports,
  public.sponsor_leads,
  public.sponsor_promotions,
  public.marketplace_listing_intents
to service_role;

grant select on table
  public.news_article_comments,
  public.community_posts,
  public.community_comments,
  public.sponsor_promotions
to anon, authenticated;

grant insert on table
  public.news_article_comments,
  public.community_posts,
  public.community_comments,
  public.moderation_reports,
  public.marketplace_listing_intents
to authenticated;

grant select on table public.marketplace_listing_intents to authenticated;

create index if not exists newsletter_subscriptions_email_idx on public.newsletter_subscriptions (lower(email));
create index if not exists collector_waitlist_created_at_idx on public.collector_waitlist (created_at desc);
create index if not exists news_article_comments_story_idx on public.news_article_comments (story_id, created_at desc);
create unique index if not exists news_article_comments_local_id_idx on public.news_article_comments (local_id) where local_id is not null;
create index if not exists community_posts_status_created_idx on public.community_posts (status, created_at desc);
create unique index if not exists community_posts_local_id_idx on public.community_posts (local_id) where local_id is not null;
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at desc);
create index if not exists community_comments_local_post_idx on public.community_comments (local_post_id, created_at desc);
create unique index if not exists community_comments_local_id_idx on public.community_comments (local_id) where local_id is not null;
create index if not exists moderation_reports_status_idx on public.moderation_reports (status, created_at desc);
create index if not exists sponsor_leads_status_idx on public.sponsor_leads (status, created_at desc);
create unique index if not exists sponsor_leads_local_id_idx on public.sponsor_leads (local_id) where local_id is not null;
create index if not exists sponsor_promotions_status_idx on public.sponsor_promotions (status, placement, priority desc);
create unique index if not exists sponsor_promotions_local_id_idx on public.sponsor_promotions (local_id) where local_id is not null;
create index if not exists marketplace_listing_intents_profile_idx on public.marketplace_listing_intents (profile_id, created_at desc);
create unique index if not exists marketplace_listing_intents_local_id_idx on public.marketplace_listing_intents (local_id) where local_id is not null;

drop policy if exists "published news comments are readable" on public.news_article_comments;
create policy "published news comments are readable"
on public.news_article_comments for select
to anon, authenticated
using (status = 'published');

drop policy if exists "members can create news comments" on public.news_article_comments;
create policy "members can create news comments"
on public.news_article_comments for insert
to authenticated
with check ((select auth.uid()) = profile_id and status in ('published', 'needs_review'));

drop policy if exists "published community posts are readable" on public.community_posts;
create policy "published community posts are readable"
on public.community_posts for select
to anon, authenticated
using (status = 'published');

drop policy if exists "members can create community posts" on public.community_posts;
create policy "members can create community posts"
on public.community_posts for insert
to authenticated
with check ((select auth.uid()) = profile_id and status in ('published', 'needs_review'));

drop policy if exists "published community comments are readable" on public.community_comments;
create policy "published community comments are readable"
on public.community_comments for select
to anon, authenticated
using (status = 'published');

drop policy if exists "members can create community comments" on public.community_comments;
create policy "members can create community comments"
on public.community_comments for insert
to authenticated
with check ((select auth.uid()) = profile_id and status in ('published', 'needs_review'));

drop policy if exists "members can create moderation reports" on public.moderation_reports;
create policy "members can create moderation reports"
on public.moderation_reports for insert
to authenticated
with check ((select auth.uid()) = reporter_profile_id);

drop policy if exists "active sponsor promotions are readable" on public.sponsor_promotions;
create policy "active sponsor promotions are readable"
on public.sponsor_promotions for select
to anon, authenticated
using (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

drop policy if exists "members can create marketplace intent waitlist rows" on public.marketplace_listing_intents;
create policy "members can create marketplace intent waitlist rows"
on public.marketplace_listing_intents for insert
to authenticated
with check ((select auth.uid()) = profile_id and status = 'waitlist');

drop policy if exists "members can view their marketplace intents" on public.marketplace_listing_intents;
create policy "members can view their marketplace intents"
on public.marketplace_listing_intents for select
to authenticated
using ((select auth.uid()) = profile_id);
