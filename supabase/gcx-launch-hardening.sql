-- GCX launch hardening
-- Run after supabase/gcx-auth-foundation.sql and supabase/gcx-launch-data-foundation.sql.
-- Makes server-only RLS intent explicit, fixes trigger search_path lint, and adds FK indexes.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

revoke all on table
  public.profiles,
  public.newsletter_subscriptions,
  public.collector_waitlist,
  public.sponsor_leads,
  public.moderation_reports,
  public.marketplace_listing_intents
from anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.newsletter_subscriptions,
  public.collector_waitlist,
  public.sponsor_leads,
  public.moderation_reports,
  public.marketplace_listing_intents
to service_role;

drop policy if exists "profiles are readable when active" on public.profiles;
drop policy if exists "members can insert their own profile" on public.profiles;
drop policy if exists "members can update their own profile" on public.profiles;

drop policy if exists "server only profiles" on public.profiles;
create policy "server only profiles"
on public.profiles for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "server only newsletter subscriptions" on public.newsletter_subscriptions;
create policy "server only newsletter subscriptions"
on public.newsletter_subscriptions for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "server only collector waitlist" on public.collector_waitlist;
create policy "server only collector waitlist"
on public.collector_waitlist for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "server only sponsor leads" on public.sponsor_leads;
create policy "server only sponsor leads"
on public.sponsor_leads for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "server only moderation reports" on public.moderation_reports;
create policy "server only moderation reports"
on public.moderation_reports for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "members can create moderation reports" on public.moderation_reports;

drop policy if exists "server only marketplace listing intents" on public.marketplace_listing_intents;
create policy "server only marketplace listing intents"
on public.marketplace_listing_intents for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "members can create marketplace intent waitlist rows" on public.marketplace_listing_intents;
drop policy if exists "members can view their marketplace intents" on public.marketplace_listing_intents;

do $$
begin
  if to_regclass('public.gcx_data_files') is not null then
    execute 'revoke all on table public.gcx_data_files from anon, authenticated';
    execute 'grant select, insert, update, delete on table public.gcx_data_files to service_role';
    execute 'alter table public.gcx_data_files enable row level security';
    execute 'drop policy if exists "server only gcx data files" on public.gcx_data_files';
    execute 'create policy "server only gcx data files" on public.gcx_data_files for all to anon, authenticated using (false) with check (false)';
  end if;

  if to_regclass('public.gcx_import_runs') is not null then
    execute 'revoke all on table public.gcx_import_runs from anon, authenticated';
    execute 'grant select, insert, update, delete on table public.gcx_import_runs to service_role';
    execute 'alter table public.gcx_import_runs enable row level security';
    execute 'drop policy if exists "server only gcx import runs" on public.gcx_import_runs';
    execute 'create policy "server only gcx import runs" on public.gcx_import_runs for all to anon, authenticated using (false) with check (false)';
  end if;

  if to_regclass('public.gcx_records') is not null then
    execute 'revoke all on table public.gcx_records from anon, authenticated';
    execute 'grant select, insert, update, delete on table public.gcx_records to service_role';
    execute 'alter table public.gcx_records enable row level security';
    execute 'drop policy if exists "server only gcx records" on public.gcx_records';
    execute 'create policy "server only gcx records" on public.gcx_records for all to anon, authenticated using (false) with check (false)';
  end if;
end $$;

create index if not exists collector_waitlist_profile_id_idx
on public.collector_waitlist (profile_id)
where profile_id is not null;

create index if not exists news_article_comments_profile_id_idx
on public.news_article_comments (profile_id)
where profile_id is not null;

create index if not exists community_posts_profile_id_idx
on public.community_posts (profile_id)
where profile_id is not null;

create index if not exists community_comments_profile_id_idx
on public.community_comments (profile_id)
where profile_id is not null;

create index if not exists moderation_reports_reporter_profile_id_idx
on public.moderation_reports (reporter_profile_id)
where reporter_profile_id is not null;

create index if not exists moderation_reports_reviewed_by_idx
on public.moderation_reports (reviewed_by)
where reviewed_by is not null;

create unique index if not exists news_article_comments_local_id_unique_idx
on public.news_article_comments (local_id);

create unique index if not exists community_posts_local_id_unique_idx
on public.community_posts (local_id);

create unique index if not exists community_comments_local_id_unique_idx
on public.community_comments (local_id);

create unique index if not exists sponsor_leads_local_id_unique_idx
on public.sponsor_leads (local_id);

create unique index if not exists sponsor_promotions_local_id_unique_idx
on public.sponsor_promotions (local_id);

create unique index if not exists marketplace_listing_intents_local_id_unique_idx
on public.marketplace_listing_intents (local_id);
