-- 002: DataIsData super-admins, titles + page permissions, team list, message center.
-- Safe to run more than once.

-- ---------- DataIsData platform admins (see and manage every company) ----------
create table if not exists public.platform_admins (
  email text primary key,
  display_name text not null
);
alter table public.platform_admins enable row level security;
insert into public.platform_admins (email, display_name) values
  ('azaiah@dataisdata.com', 'Azaiah Wood'),
  ('tony@dataisdata.com', 'Tony Wood')
on conflict (email) do update set display_name = excluded.display_name;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

-- Platform admins see every company and act with the 'platform' role.
create or replace function public.my_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.members where user_id = auth.uid()
  union
  select id from public.companies where public.is_platform_admin()
$$;

create or replace function public.my_role(c uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when public.is_platform_admin() then 'platform'
    else (select role from public.members where user_id = auth.uid() and company_id = c) end
$$;

-- Azaiah is a platform admin now, not a CWN member.
delete from public.invites where lower(email) = 'azaiah@dataisdata.com';

-- ---------- titles and per-person page permissions ----------
alter table public.members add column if not exists title text;
alter table public.members add column if not exists pages text[];   -- null = the role's default pages
alter table public.invites add column if not exists title text;
alter table public.invites add column if not exists pages text[];

create or replace function public.accept_invites() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (company_id, user_id, role, display_name, email, title, pages)
  select i.company_id, new.id, i.role, i.display_name, lower(new.email), i.title, i.pages
  from public.invites i where lower(i.email) = lower(new.email)
  on conflict do nothing;
  return new;
end $$;

create or replace function public.claim_invites() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (company_id, user_id, role, display_name, email, title, pages)
  select i.company_id, auth.uid(), i.role, i.display_name, lower(i.email), i.title, i.pages
  from public.invites i where lower(i.email) = lower(auth.jwt() ->> 'email')
  on conflict do nothing;
end $$;

-- CWN's COO, Tequila Samuel: full access.
insert into public.invites (email, company_id, role, display_name, title)
select 'tsamuel@luxehomeesthetics.com', id, 'admin', 'Tequila Samuel', 'COO' from public.companies where slug = 'cwn-carriers'
on conflict (email, company_id) do update set role = 'admin', display_name = 'Tequila Samuel', title = 'COO';
update public.invites set title = 'Owner' where lower(email) = 'lsamuel@cwn-carriers.com' and title is null;

-- What the signed-in person can open: one row per company.
create or replace function public.my_access()
returns table (company_id uuid, company_name text, role text, display_name text, title text, pages text[])
language sql stable security definer set search_path = public as $$
  select m.company_id, c.name, m.role, m.display_name, m.title, m.pages
  from public.members m join public.companies c on c.id = m.company_id
  where m.user_id = auth.uid() and not public.is_platform_admin()
  union all
  select c.id, c.name, 'platform', p.display_name, 'DataIsData admin', null::text[]
  from public.companies c join public.platform_admins p on lower(p.email) = lower(auth.jwt() ->> 'email')
$$;

-- Everyone in a company (plus DataIsData admins who have signed up), for the team list, messages and "view as".
create or replace function public.company_people(c uuid)
returns table (user_id uuid, display_name text, email text, role text, title text, pages text[])
language sql stable security definer set search_path = public as $$
  select m.user_id, coalesce(m.display_name, m.email), m.email, m.role, m.title, m.pages
  from public.members m where m.company_id = c and c in (select public.my_company_ids())
  union all
  select u.id, p.display_name, lower(u.email), 'platform', 'DataIsData admin', null::text[]
  from public.platform_admins p join auth.users u on lower(u.email) = lower(p.email)
  where c in (select public.my_company_ids())
$$;

-- ---------- policies: add the platform role, protect the owner ----------
drop policy if exists "owners manage team" on public.members;
create policy "owners manage team" on public.members for all
  using (public.my_role(company_id) in ('owner', 'admin', 'platform') and (role <> 'owner' or public.my_role(company_id) in ('owner', 'platform')))
  with check (public.my_role(company_id) in ('owner', 'admin', 'platform') and (role <> 'owner' or public.my_role(company_id) in ('owner', 'platform')));

drop policy if exists "owners manage invites" on public.invites;
create policy "owners manage invites" on public.invites for all
  using (public.my_role(company_id) in ('owner', 'admin', 'platform'))
  with check (public.my_role(company_id) in ('owner', 'admin', 'platform') and (role <> 'owner' or public.my_role(company_id) in ('owner', 'platform')));

drop policy if exists "write company data" on public.portal_state;
create policy "write company data" on public.portal_state for insert
  with check (public.my_role(company_id) in ('owner', 'admin', 'dispatcher', 'platform') or (public.my_role(company_id) = 'driver' and key in ('loads', 'activity')));
drop policy if exists "update company data" on public.portal_state;
create policy "update company data" on public.portal_state for update
  using (company_id in (select public.my_company_ids()))
  with check (public.my_role(company_id) in ('owner', 'admin', 'dispatcher', 'platform') or (public.my_role(company_id) = 'driver' and key in ('loads', 'activity')));

drop policy if exists "owners read history" on public.portal_history;
create policy "owners read history" on public.portal_history for select using (public.my_role(company_id) in ('owner', 'admin', 'platform'));

-- ---------- message center ----------
-- to_user null = the team board (everyone in the company). Otherwise a private message.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_name text,
  to_user uuid references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  is_task boolean not null default false,
  done boolean not null default false,
  done_by text,
  assignee uuid references auth.users(id) on delete set null,
  assignee_name text,
  due date,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_company_created on public.messages (company_id, created_at desc);
alter table public.messages enable row level security;

drop policy if exists "read board and my messages" on public.messages;
create policy "read board and my messages" on public.messages for select
  using (company_id in (select public.my_company_ids()) and (to_user is null or from_user = auth.uid() or to_user = auth.uid()));
drop policy if exists "post as myself" on public.messages;
create policy "post as myself" on public.messages for insert
  with check (company_id in (select public.my_company_ids()) and from_user = auth.uid());
-- Anyone on the team can tick a board task done; private messages only by their two people.
drop policy if exists "update board or mine" on public.messages;
create policy "update board or mine" on public.messages for update
  using (company_id in (select public.my_company_ids()) and (to_user is null or from_user = auth.uid() or to_user = auth.uid()));
drop policy if exists "delete mine or manage board" on public.messages;
create policy "delete mine or manage board" on public.messages for delete
  using (from_user = auth.uid() or (to_user is null and public.my_role(company_id) in ('owner', 'admin', 'platform')));

-- Read receipts per conversation ('board' or the other person's user id) for unread badges.
create table if not exists public.message_reads (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  thread text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, company_id, thread)
);
alter table public.message_reads enable row level security;
drop policy if exists "my reads" on public.message_reads;
create policy "my reads" on public.message_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
