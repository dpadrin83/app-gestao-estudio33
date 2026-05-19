-- ====================================================================
-- Hub Estúdio 33 — Fase 3: entregáveis, portal cliente, financeiro
-- ====================================================================

-- ─── clients: vínculo com login do portal ─────────────────────────────
alter table public.clients
  add column if not exists auth_user_id uuid unique;

create index if not exists clients_auth_user_id_idx on public.clients (auth_user_id);

-- ─── helpers RLS ────────────────────────────────────────────────────
create or replace function public.is_hub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and not exists (
      select 1 from public.clients c where c.auth_user_id = auth.uid()
    );
$$;

create or replace function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id from public.clients c where c.auth_user_id = auth.uid() limit 1;
$$;

-- ─── app_settings ───────────────────────────────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('hourly_rate', '150'::jsonb)
on conflict (key) do nothing;

-- ─── deliverables ───────────────────────────────────────────────────
create table if not exists public.deliverables (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  name        text not null,
  type        text not null default 'link'
              check (type in ('video','design','doc','code','link')),
  status      text not null default 'draft'
              check (status in ('draft','internal_review','sent_to_client','approved','rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists deliverables_project_id_idx on public.deliverables (project_id);
create index if not exists deliverables_status_idx on public.deliverables (status);

drop trigger if exists deliverables_updated_at on public.deliverables;
create trigger deliverables_updated_at
  before update on public.deliverables
  for each row execute function public.set_updated_at();

-- ─── deliverable_versions ───────────────────────────────────────────
create table if not exists public.deliverable_versions (
  id              uuid primary key default gen_random_uuid(),
  deliverable_id  uuid not null references public.deliverables(id) on delete cascade,
  version_number  int not null check (version_number > 0),
  external_link   text,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (deliverable_id, version_number)
);

create index if not exists deliverable_versions_deliverable_idx
  on public.deliverable_versions (deliverable_id, version_number desc);

-- ─── deliverable_comments ───────────────────────────────────────────
create table if not exists public.deliverable_comments (
  id              uuid primary key default gen_random_uuid(),
  deliverable_id  uuid not null references public.deliverables(id) on delete cascade,
  author_role     text not null check (author_role in ('admin','client')),
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists deliverable_comments_deliverable_idx
  on public.deliverable_comments (deliverable_id, created_at desc);

-- ─── project_costs ──────────────────────────────────────────────────
create table if not exists public.project_costs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  description  text not null,
  amount       numeric(12, 2) not null check (amount >= 0),
  incurred_at  date not null default current_date,
  created_at   timestamptz not null default now()
);

create index if not exists project_costs_project_id_idx on public.project_costs (project_id);

-- ─── projects: status de pagamento ──────────────────────────────────
alter table public.projects
  add column if not exists payment_status text not null default 'to_invoice'
  check (payment_status in ('to_invoice','invoiced','received'));

-- ─── RLS: refinar policies existentes + novas tabelas ───────────────

-- clients
drop policy if exists "auth all on clients" on public.clients;
drop policy if exists "admin all on clients" on public.clients;
drop policy if exists "client read own client" on public.clients;
create policy "admin all on clients" on public.clients
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
create policy "client read own client" on public.clients
  for select to authenticated
  using (id = public.my_client_id());

-- projects
drop policy if exists "auth all on projects" on public.projects;
drop policy if exists "admin all on projects" on public.projects;
drop policy if exists "client read own projects" on public.projects;
create policy "admin all on projects" on public.projects
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
create policy "client read own projects" on public.projects
  for select to authenticated
  using (client_id = public.my_client_id());

-- time_sessions
drop policy if exists "auth all on time_sessions" on public.time_sessions;
drop policy if exists "admin all on time_sessions" on public.time_sessions;
create policy "admin all on time_sessions" on public.time_sessions
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

-- activities
drop policy if exists "auth all on activities" on public.activities;
drop policy if exists "admin all on activities" on public.activities;
drop policy if exists "client read visible milestones" on public.activities;
create policy "admin all on activities" on public.activities
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
create policy "client read visible milestones" on public.activities
  for select to authenticated
  using (
    visible_to_client = true
    and project_id in (
      select p.id from public.projects p where p.client_id = public.my_client_id()
    )
  );

-- activity_dependencies (admin only)
drop policy if exists "auth all on activity_dependencies" on public.activity_dependencies;
drop policy if exists "admin all on activity_dependencies" on public.activity_dependencies;
create policy "admin all on activity_dependencies" on public.activity_dependencies
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

-- schedule templates (admin read)
drop policy if exists "auth all on schedule_templates" on public.schedule_templates;
drop policy if exists "admin read schedule_templates" on public.schedule_templates;
create policy "admin read schedule_templates" on public.schedule_templates
  for select to authenticated using (public.is_hub_admin());
drop policy if exists "auth all on schedule_template_items" on public.schedule_template_items;
drop policy if exists "admin read schedule_template_items" on public.schedule_template_items;
create policy "admin read schedule_template_items" on public.schedule_template_items
  for select to authenticated using (public.is_hub_admin());

-- deliverables
alter table public.deliverables enable row level security;
drop policy if exists "admin all on deliverables" on public.deliverables;
drop policy if exists "client read sent deliverables" on public.deliverables;
drop policy if exists "client update approval on deliverables" on public.deliverables;
create policy "admin all on deliverables" on public.deliverables
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
create policy "client read sent deliverables" on public.deliverables
  for select to authenticated
  using (
    status in ('sent_to_client','approved','rejected')
    and project_id in (
      select p.id from public.projects p where p.client_id = public.my_client_id()
    )
  );
create policy "client update approval on deliverables" on public.deliverables
  for update to authenticated
  using (
    status = 'sent_to_client'
    and project_id in (
      select p.id from public.projects p where p.client_id = public.my_client_id()
    )
  )
  with check (status in ('approved','rejected'));

-- deliverable_versions
alter table public.deliverable_versions enable row level security;
drop policy if exists "admin all on deliverable_versions" on public.deliverable_versions;
drop policy if exists "client read deliverable_versions" on public.deliverable_versions;
create policy "admin all on deliverable_versions" on public.deliverable_versions
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
create policy "client read deliverable_versions" on public.deliverable_versions
  for select to authenticated
  using (
    deliverable_id in (
      select d.id from public.deliverables d
      join public.projects p on p.id = d.project_id
      where p.client_id = public.my_client_id()
        and d.status in ('sent_to_client','approved','rejected')
    )
  );

-- deliverable_comments
alter table public.deliverable_comments enable row level security;
drop policy if exists "admin all on deliverable_comments" on public.deliverable_comments;
drop policy if exists "client read comments" on public.deliverable_comments;
drop policy if exists "client insert comments" on public.deliverable_comments;
create policy "admin all on deliverable_comments" on public.deliverable_comments
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
create policy "client read comments" on public.deliverable_comments
  for select to authenticated
  using (
    deliverable_id in (
      select d.id from public.deliverables d
      join public.projects p on p.id = d.project_id
      where p.client_id = public.my_client_id()
    )
  );
create policy "client insert comments" on public.deliverable_comments
  for insert to authenticated
  with check (
    author_role = 'client'
    and deliverable_id in (
      select d.id from public.deliverables d
      join public.projects p on p.id = d.project_id
      where p.client_id = public.my_client_id()
        and d.status = 'sent_to_client'
    )
  );

-- project_costs (admin only)
alter table public.project_costs enable row level security;
drop policy if exists "admin all on project_costs" on public.project_costs;
create policy "admin all on project_costs" on public.project_costs
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

-- app_settings (admin only)
alter table public.app_settings enable row level security;
drop policy if exists "admin all on app_settings" on public.app_settings;
create policy "admin all on app_settings" on public.app_settings
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
