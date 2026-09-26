-- GCX Supabase Auth foundation
-- Run this in the Supabase SQL Editor after Auth is enabled.
-- It creates public profile rows tied to Supabase Auth users and protects writes with RLS.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'GCX Member',
  handle text unique,
  avatar_url text,
  bio text not null default 'GCX member ready to talk games, cards, and collecting.',
  interests text[] not null default array['games', 'cards'],
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable when active" on public.profiles;
create policy "profiles are readable when active"
on public.profiles
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "members can insert their own profile" on public.profiles;
create policy "members can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id and role = 'member');

drop policy if exists "members can update their own profile" on public.profiles;
create policy "members can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = 'member');

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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_display_name text;
  raw_handle text;
begin
  raw_display_name := coalesce(new.raw_user_meta_data ->> 'displayName', new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'GCX Member');
  raw_handle := lower(regexp_replace(raw_display_name, '[^a-zA-Z0-9]+', '', 'g'));

  insert into public.profiles (id, display_name, handle, avatar_url)
  values (
    new.id,
    left(raw_display_name, 80),
    case when raw_handle = '' then null else '@' || left(raw_handle, 30) || '-' || left(new.id::text, 8) end,
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create index if not exists profiles_handle_idx on public.profiles (handle);
create index if not exists profiles_status_created_at_idx on public.profiles (status, created_at desc);
