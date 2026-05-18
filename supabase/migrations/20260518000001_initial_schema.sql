-- ====================================================================
-- Hub Estúdio 33 — Fase 1: schema inicial (clients, projects, time_sessions)
-- ====================================================================

-- helper: trigger pra atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── clients ────────────────────────────────────────────────────────
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  notes       text,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_name_idx   on public.clients (name);

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ─── projects ───────────────────────────────────────────────────────
create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete restrict,
  name              text not null,
  description       text,
  status            text not null default 'in_progress'
                    check (status in ('in_progress','paused','done','archived')),
  start_date        date,
  expected_end_date date,
  contract_value    numeric(12, 2),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists projects_status_idx    on public.projects (status);
create index if not exists projects_client_id_idx on public.projects (client_id);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ─── time_sessions ──────────────────────────────────────────────────
create table if not exists public.time_sessions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  description text,
  created_at  timestamptz not null default now(),
  constraint  ended_after_started check (ended_at is null or ended_at >= started_at)
);

create index if not exists time_sessions_project_id_idx on public.time_sessions (project_id);
create index if not exists time_sessions_started_at_idx on public.time_sessions (started_at desc);

-- ─── RLS ────────────────────────────────────────────────────────────
-- Fase 1: single user. Policies "permite tudo para autenticado".
-- Fase 3 vai refinar para portal do cliente.

alter table public.clients       enable row level security;
alter table public.projects      enable row level security;
alter table public.time_sessions enable row level security;

-- clients
drop policy if exists "auth all on clients" on public.clients;
create policy "auth all on clients" on public.clients
  for all to authenticated using (true) with check (true);

-- projects
drop policy if exists "auth all on projects" on public.projects;
create policy "auth all on projects" on public.projects
  for all to authenticated using (true) with check (true);

-- time_sessions
drop policy if exists "auth all on time_sessions" on public.time_sessions;
create policy "auth all on time_sessions" on public.time_sessions
  for all to authenticated using (true) with check (true);
