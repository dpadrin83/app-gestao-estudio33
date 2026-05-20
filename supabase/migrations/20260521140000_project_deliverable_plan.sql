-- Plano de entregáveis por projeto (com dependência entre etapas)

create table if not exists public.project_deliverable_plan_items (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  name              text not null,
  deliverable_type  text not null default 'design'
                    check (deliverable_type in ('video', 'design', 'doc', 'code', 'link')),
  estimated_days    int not null default 1 check (estimated_days >= 1),
  professional_id   uuid references public.studio_professionals(id) on delete set null,
  predecessor_id    uuid references public.project_deliverable_plan_items(id) on delete set null,
  deliverable_id    uuid references public.deliverables(id) on delete set null,
  activity_id       uuid references public.activities(id) on delete set null,
  notes             text,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint plan_no_self_predecessor check (id is distinct from predecessor_id)
);

create index if not exists project_deliverable_plan_project_idx
  on public.project_deliverable_plan_items (project_id, sort_order);

alter table public.project_deliverable_plan_items enable row level security;

drop policy if exists "admin all project_deliverable_plan" on public.project_deliverable_plan_items;
create policy "admin all project_deliverable_plan" on public.project_deliverable_plan_items
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

comment on table public.project_deliverable_plan_items is
  'Plano de entregáveis: nome, dias, dependência (predecessor) e vínculo com cronograma.';
