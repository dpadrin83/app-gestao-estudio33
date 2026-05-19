-- ====================================================================
-- Hub Estúdio 33 — Fase 5: tarefas Kanban (execução diária)
-- ====================================================================

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  activity_id  uuid references public.activities(id) on delete set null,
  title        text not null,
  description  text,
  status       text not null default 'todo'
               check (status in ('todo','doing','done')),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks (project_id, status, sort_order);
create index if not exists tasks_activity_id_idx on public.tasks (activity_id);

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists "admin all on tasks" on public.tasks;
create policy "admin all on tasks" on public.tasks
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
