-- TruckLoad Advisor: initial Supabase schema
-- Run this complete file in Supabase Dashboard > SQL Editor.
-- It creates secure per-user profiles and prepares tables for future live loads.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company_name text,
  role text not null default 'Owner-operator',
  equipment text not null default 'Dry Van',
  plan text not null default 'Pro',
  subscription_status text not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  operating_cost_per_mile numeric(8,2) not null default 1.55
    check (operating_cost_per_mile > 0),
  max_deadhead integer not null default 150
    check (max_deadhead >= 0),
  preferred_equipment text,
  current_city text,
  updated_at timestamptz not null default now()
);

-- Prepared for later API imports. It is intentionally inaccessible from the
-- public browser until we add a controlled read policy and subscription checks.
create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_load_id text not null,
  source_url text,
  origin_city text not null,
  origin_state text not null,
  destination_city text not null,
  destination_state text not null,
  equipment text not null,
  gross_rate numeric(12,2),
  loaded_miles integer,
  deadhead_miles integer not null default 0,
  weight_lbs integer,
  pickup_at timestamptz,
  delivery_at timestamptz,
  broker_name text,
  broker_mc_number text,
  status text not null default 'available',
  expires_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_name, source_load_id)
);

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.loads enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.driver_profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can view their own driver profile" on public.driver_profiles;
create policy "Users can view their own driver profile"
on public.driver_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own driver profile" on public.driver_profiles;
create policy "Users can insert their own driver profile"
on public.driver_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own driver profile" on public.driver_profiles;
create policy "Users can update their own driver profile"
on public.driver_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    company_name,
    role,
    equipment,
    plan
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'Owner-operator'),
    coalesce(new.raw_user_meta_data ->> 'equipment', 'Dry Van'),
    coalesce(new.raw_user_meta_data ->> 'plan', 'Pro')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    company_name = excluded.company_name,
    role = excluded.role,
    equipment = excluded.equipment,
    plan = excluded.plan,
    updated_at = now();

  insert into public.driver_profiles (
    user_id,
    preferred_equipment
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'equipment', 'Dry Van')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- No browser policy is created for public.loads yet.
-- Future authorized API imports should run through a protected backend or
-- Supabase Edge Function using a secret key, never from GitHub Pages.
