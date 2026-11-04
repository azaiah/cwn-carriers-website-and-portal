-- CWN Carriers portal: database schema (Supabase / Postgres)
-- Built so DataIsData can run many carriers from one codebase: every row belongs
-- to a company, and Row Level Security means a user only ever sees their own
-- company's data. Run this whole file once in the Supabase SQL editor.

-- ---------- companies & people ----------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'dispatcher', 'driver')),
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

-- Invite-only access: a person gets into a company only if their email is invited.
create table if not exists public.invites (
  email text not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'dispatcher', 'driver')),
  display_name text,
  created_at timestamptz not null default now(),
  primary key (email, company_id)
);

-- ---------- the portal's saved data ----------
-- One row per area of the portal (brain, opps, loads, drivers, customers,
-- compliance, outreach, activity, settings). Each save replaces that area.
create table if not exists public.portal_state (
  company_id uuid not null references public.companies(id) on delete cascade,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (company_id, key)
);

-- Every save is also kept as a version, so nothing typed is ever lost.
create table if not exists public.portal_history (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  key text not null,
  data jsonb not null,
  saved_at timestamptz not null default now(),
  saved_by uuid references auth.users(id) on delete set null
);
create index if not exists portal_history_company_key on public.portal_history (company_id, key, saved_at desc);

-- ---------- helpers ----------
create or replace function public.my_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.members where user_id = auth.uid()
$$;

create or replace function public.my_role(c uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.members where user_id = auth.uid() and company_id = c
$$;

-- New sign-up → join every company that invited this email.
create or replace function public.accept_invites() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (company_id, user_id, role, display_name, email)
  select i.company_id, new.id, i.role, i.display_name, lower(new.email)
  from public.invites i where lower(i.email) = lower(new.email)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.accept_invites();

-- Already signed up before being invited? The portal calls this after sign-in.
create or replace function public.claim_invites() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (company_id, user_id, role, display_name, email)
  select i.company_id, auth.uid(), i.role, i.display_name, lower(i.email)
  from public.invites i where lower(i.email) = lower(auth.jwt() ->> 'email')
  on conflict do nothing;
end $$;

-- Keep a version of every save.
create or replace function public.keep_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.portal_history (company_id, key, data, saved_by) values (new.company_id, new.key, new.data, new.updated_by);
  return new;
end $$;
drop trigger if exists portal_state_history on public.portal_state;
create trigger portal_state_history after insert or update on public.portal_state
  for each row execute function public.keep_history();

-- ---------- security (Row Level Security) ----------
alter table public.companies enable row level security;
alter table public.members enable row level security;
alter table public.invites enable row level security;
alter table public.portal_state enable row level security;
alter table public.portal_history enable row level security;

drop policy if exists "members see their company" on public.companies;
create policy "members see their company" on public.companies for select using (id in (select public.my_company_ids()));

drop policy if exists "see teammates" on public.members;
create policy "see teammates" on public.members for select using (company_id in (select public.my_company_ids()));
drop policy if exists "owners manage team" on public.members;
create policy "owners manage team" on public.members for all
  using (public.my_role(company_id) in ('owner', 'admin')) with check (public.my_role(company_id) in ('owner', 'admin'));

drop policy if exists "owners manage invites" on public.invites;
create policy "owners manage invites" on public.invites for all
  using (public.my_role(company_id) in ('owner', 'admin')) with check (public.my_role(company_id) in ('owner', 'admin'));

drop policy if exists "read company data" on public.portal_state;
create policy "read company data" on public.portal_state for select using (company_id in (select public.my_company_ids()));
-- Owners, admins and dispatchers save everything. Drivers can only save loads (BOL/POD) and the activity feed.
drop policy if exists "write company data" on public.portal_state;
create policy "write company data" on public.portal_state for insert
  with check (public.my_role(company_id) in ('owner', 'admin', 'dispatcher') or (public.my_role(company_id) = 'driver' and key in ('loads', 'activity')));
drop policy if exists "update company data" on public.portal_state;
create policy "update company data" on public.portal_state for update
  using (company_id in (select public.my_company_ids()))
  with check (public.my_role(company_id) in ('owner', 'admin', 'dispatcher') or (public.my_role(company_id) = 'driver' and key in ('loads', 'activity')));

drop policy if exists "owners read history" on public.portal_history;
create policy "owners read history" on public.portal_history for select using (public.my_role(company_id) in ('owner', 'admin'));

-- ---------- files (BOLs, PODs, insurance certificates, medical cards) ----------
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
-- Files live under <company_id>/..., and only that company's members can touch them.
drop policy if exists "company files read" on storage.objects;
create policy "company files read" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1]::uuid in (select public.my_company_ids()));
drop policy if exists "company files write" on storage.objects;
create policy "company files write" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1]::uuid in (select public.my_company_ids()));
drop policy if exists "company files update" on storage.objects;
create policy "company files update" on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1]::uuid in (select public.my_company_ids()));

-- ---------- live updates between devices ----------
do $$ begin
  alter publication supabase_realtime add table public.portal_state;
exception when duplicate_object then null; end $$;

-- ---------- CWN Carriers ----------
insert into public.companies (name, slug) values ('CWN Carriers', 'cwn-carriers') on conflict (slug) do nothing;
insert into public.invites (email, company_id, role, display_name)
select 'lsamuel@cwn-carriers.com', id, 'owner', 'Lawrence Samuel' from public.companies where slug = 'cwn-carriers'
on conflict do nothing;
insert into public.invites (email, company_id, role, display_name)
select 'azaiah@dataisdata.com', id, 'admin', 'Azaiah (DataIsData)' from public.companies where slug = 'cwn-carriers'
on conflict do nothing;
