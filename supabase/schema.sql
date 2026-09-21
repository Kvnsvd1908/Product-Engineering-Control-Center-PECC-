create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'admin', 'pm', 'approver', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'success' check (status in ('running', 'success', 'partial', 'failed')),
  head text,
  payload jsonb not null,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  encrypted_data text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id text primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  path text not null,
  title text not null,
  reason text not null,
  before_content text not null,
  after_content text not null,
  head text not null,
  status text not null default 'pending' check (status in ('pending', 'applying', 'applied', 'rejected', 'failed')),
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists snapshots_project_created_idx on public.snapshots(project_id, created_at desc);
create index if not exists proposals_project_created_idx on public.proposals(project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.memberships enable row level security;
alter table public.snapshots enable row level security;
alter table public.connections enable row level security;
alter table public.proposals enable row level security;

create or replace function public.is_project_owner(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.projects where id = target_project_id and owner_id = auth.uid());
$$;

create or replace function public.is_project_member(target_project_id uuid, allowed_roles text[] default null)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where project_id = target_project_id
      and user_id = auth.uid()
      and (allowed_roles is null or role = any(allowed_roles))
  );
$$;

revoke all on function public.is_project_owner(uuid) from public;
revoke all on function public.is_project_member(uuid, text[]) from public;
grant execute on function public.is_project_owner(uuid) to authenticated;
grant execute on function public.is_project_member(uuid, text[]) to authenticated;

drop policy if exists "project members can read projects" on public.projects;
drop policy if exists "users can create projects" on public.projects;
drop policy if exists "owners can update projects" on public.projects;
drop policy if exists "owners can delete projects" on public.projects;
drop policy if exists "members can read memberships" on public.memberships;
drop policy if exists "owners can add memberships" on public.memberships;
drop policy if exists "owners can update memberships" on public.memberships;
drop policy if exists "owners can delete memberships" on public.memberships;
drop policy if exists "members can read snapshots" on public.snapshots;
drop policy if exists "project operators can write snapshots" on public.snapshots;
drop policy if exists "members can read connections" on public.connections;
drop policy if exists "project operators can write connections" on public.connections;
drop policy if exists "members can read proposals" on public.proposals;
drop policy if exists "project operators can create proposals" on public.proposals;
drop policy if exists "approvers can update proposals" on public.proposals;

create policy "project members can read projects" on public.projects for select using (
  owner_id = auth.uid() or public.is_project_member(id)
);
create policy "users can create projects" on public.projects for insert with check (owner_id = auth.uid());
create policy "owners can update projects" on public.projects for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners can delete projects" on public.projects for delete using (owner_id = auth.uid());

create policy "members can read memberships" on public.memberships for select using (
  user_id = auth.uid() or public.is_project_owner(project_id)
);
create policy "owners can add memberships" on public.memberships for insert with check (
  public.is_project_owner(project_id)
);
create policy "owners can update memberships" on public.memberships for update using (
  public.is_project_owner(project_id)
);
create policy "owners can delete memberships" on public.memberships for delete using (
  public.is_project_owner(project_id)
);

create policy "members can read snapshots" on public.snapshots for select using (
  public.is_project_member(project_id) or public.is_project_owner(project_id)
);
create policy "project operators can write snapshots" on public.snapshots for insert with check (
  public.is_project_member(project_id, array['owner', 'admin', 'pm']) or public.is_project_owner(project_id)
);

create policy "members can read connections" on public.connections for select using (
  public.is_project_member(project_id) or public.is_project_owner(project_id)
);
create policy "project operators can write connections" on public.connections for all using (
  public.is_project_member(project_id, array['owner', 'admin', 'pm']) or public.is_project_owner(project_id)
) with check (
  public.is_project_member(project_id, array['owner', 'admin', 'pm']) or public.is_project_owner(project_id)
);

create policy "members can read proposals" on public.proposals for select using (
  public.is_project_member(project_id) or public.is_project_owner(project_id)
);
create policy "project operators can create proposals" on public.proposals for insert with check (
  created_by = auth.uid() and (public.is_project_member(project_id, array['owner', 'admin', 'pm']) or public.is_project_owner(project_id))
);
create policy "approvers can update proposals" on public.proposals for update using (
  public.is_project_member(project_id, array['owner', 'admin', 'approver']) or public.is_project_owner(project_id)
);
