-- ====================================================================
-- Hub Estúdio 33 — Fase 2: cronograma (activities, dependencies, templates)
-- ====================================================================

-- ─── activities ─────────────────────────────────────────────────────
create table if not exists public.activities (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  phase                   text not null default 'production'
                          check (phase in ('planning','production','review','delivery','other')),
  kind                    text not null default 'activity'
                          check (kind in ('activity','milestone')),
  name                    text not null,
  description             text,
  estimated_duration_days int not null default 1 check (estimated_duration_days >= 0),
  planned_start_date      date not null,
  planned_end_date        date not null,
  actual_start_date       date,
  actual_end_date         date,
  status                  text not null default 'not_started'
                          check (status in ('not_started','in_progress','completed','delayed')),
  visible_to_client       boolean not null default false,
  sort_order              int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint planned_range check (planned_end_date >= planned_start_date),
  constraint actual_range check (
    actual_end_date is null
    or actual_start_date is null
    or actual_end_date >= actual_start_date
  )
);

create index if not exists activities_project_id_idx on public.activities (project_id);
create index if not exists activities_status_idx on public.activities (status);
create index if not exists activities_planned_end_idx on public.activities (planned_end_date);

drop trigger if exists activities_updated_at on public.activities;
create trigger activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ─── activity_dependencies ──────────────────────────────────────────
create table if not exists public.activity_dependencies (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities(id) on delete cascade,
  predecessor_id  uuid not null references public.activities(id) on delete cascade,
  dependency_type text not null default 'FS' check (dependency_type in ('FS')),
  lag_days        int not null default 0 check (lag_days >= 0),
  created_at      timestamptz not null default now(),
  constraint no_self_dependency check (activity_id <> predecessor_id),
  unique (activity_id, predecessor_id)
);

create index if not exists activity_deps_activity_idx on public.activity_dependencies (activity_id);
create index if not exists activity_deps_predecessor_idx on public.activity_dependencies (predecessor_id);

-- ─── schedule_templates ─────────────────────────────────────────────
create table if not exists public.schedule_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.schedule_template_items (
  id                      uuid primary key default gen_random_uuid(),
  template_id             uuid not null references public.schedule_templates(id) on delete cascade,
  name                    text not null,
  phase                   text not null default 'production'
                          check (phase in ('planning','production','review','delivery','other')),
  kind                    text not null default 'activity'
                          check (kind in ('activity','milestone')),
  estimated_duration_days int not null default 1 check (estimated_duration_days >= 0),
  sort_order              int not null default 0,
  predecessor_sort_order  int,
  lag_days                int not null default 0 check (lag_days >= 0)
);

create index if not exists schedule_template_items_template_idx
  on public.schedule_template_items (template_id, sort_order);

-- ─── helpers de data ────────────────────────────────────────────────
create or replace function public.activity_effective_end(a public.activities)
returns date
language sql
immutable
as $$
  select coalesce(a.actual_end_date, a.planned_end_date);
$$;

-- ─── recálculo forward scheduling por projeto ───────────────────────
create or replace function public.recalculate_project_schedule(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_start date;
  v_end date;
  v_max_pred_end date;
begin
  -- Ordem topológica aproximada: sort_order, depois profundidade via loop
  for r in
    with recursive deps as (
      select a.id, 0 as depth
      from public.activities a
      where a.project_id = p_project_id
        and not exists (
          select 1 from public.activity_dependencies d
          where d.activity_id = a.id
        )
      union all
      select d.activity_id, deps.depth + 1
      from public.activity_dependencies d
      join deps on deps.id = d.predecessor_id
      join public.activities a on a.id = d.activity_id
      where a.project_id = p_project_id
    ),
    ranked as (
      select id, max(depth) as depth
      from deps
      group by id
    )
    select a.*
    from public.activities a
    left join ranked rk on rk.id = a.id
    where a.project_id = p_project_id
    order by coalesce(rk.depth, 0), a.sort_order, a.created_at
  loop
    if r.status = 'completed' or r.actual_end_date is not null then
      continue;
    end if;

    select max(
      public.activity_effective_end(p) + d.lag_days + 1
    )
    into v_max_pred_end
    from public.activity_dependencies d
    join public.activities p on p.id = d.predecessor_id
    where d.activity_id = r.id;

    if v_max_pred_end is not null and r.actual_start_date is null then
      v_start := v_max_pred_end;
      v_end := v_start + greatest(r.estimated_duration_days, 1) - 1;
      if r.kind = 'milestone' then
        v_end := v_start;
      end if;

      update public.activities
      set
        planned_start_date = v_start,
        planned_end_date = v_end,
        status = case
          when status = 'completed' then status
          when v_end < current_date and status <> 'completed' then 'delayed'
          when status = 'delayed' and v_end >= current_date and actual_start_date is null then 'not_started'
          else status
        end
      where id = r.id;
    elsif r.actual_start_date is null then
      -- Sem predecessoras: só recalcula fim pela duração
      v_start := r.planned_start_date;
      v_end := v_start + greatest(r.estimated_duration_days, 1) - 1;
      if r.kind = 'milestone' then
        v_end := v_start;
      end if;

      update public.activities
      set
        planned_end_date = v_end,
        status = case
          when status = 'completed' then status
          when v_end < current_date then 'delayed'
          else status
        end
      where id = r.id;
    else
      -- Iniciada: só ajusta fim previsto se duração mudou
      v_end := r.planned_start_date + greatest(r.estimated_duration_days, 1) - 1;
      if r.kind = 'milestone' then
        v_end := r.planned_start_date;
      end if;

      update public.activities
      set planned_end_date = v_end
      where id = r.id;
    end if;
  end loop;

  -- Marca atrasadas (não concluídas, fim previsto no passado)
  update public.activities
  set status = 'delayed'
  where project_id = p_project_id
    and status not in ('completed')
    and planned_end_date < current_date;
end;
$$;

-- ─── RLS ────────────────────────────────────────────────────────────
alter table public.activities enable row level security;
alter table public.activity_dependencies enable row level security;
alter table public.schedule_templates enable row level security;
alter table public.schedule_template_items enable row level security;

drop policy if exists "auth all on activities" on public.activities;
create policy "auth all on activities" on public.activities
  for all to authenticated using (true) with check (true);

drop policy if exists "auth all on activity_dependencies" on public.activity_dependencies;
create policy "auth all on activity_dependencies" on public.activity_dependencies
  for all to authenticated using (true) with check (true);

drop policy if exists "auth all on schedule_templates" on public.schedule_templates;
create policy "auth all on schedule_templates" on public.schedule_templates
  for select to authenticated using (true);

drop policy if exists "auth all on schedule_template_items" on public.schedule_template_items;
create policy "auth all on schedule_template_items" on public.schedule_template_items
  for select to authenticated using (true);

-- ─── seeds: templates ───────────────────────────────────────────────
insert into public.schedule_templates (name, description) values
  (
    'Identidade visual',
    'Briefing, conceito, refinamento e entrega de marca.'
  ),
  (
    'Landing page',
    'Wireframe, design, desenvolvimento, QA e deploy.'
  ),
  (
    'Sistema web',
    'Discovery, arquitetura, sprints, QA e deploy.'
  )
on conflict (name) do nothing;

-- Identidade visual
insert into public.schedule_template_items
  (template_id, name, phase, kind, estimated_duration_days, sort_order, predecessor_sort_order, lag_days)
select t.id, v.name, v.phase, v.kind, v.days, v.ord, v.pred, 0
from public.schedule_templates t
cross join (values
  ('Briefing e pesquisa', 'planning', 'activity', 3, 0, null::int),
  ('Conceito criativo', 'production', 'activity', 5, 1, 0),
  ('Refinamento e sistema', 'review', 'activity', 4, 2, 1),
  ('Entrega final', 'delivery', 'milestone', 1, 3, 2)
) as v(name, phase, kind, days, ord, pred)
where t.name = 'Identidade visual'
  and not exists (
    select 1 from public.schedule_template_items i where i.template_id = t.id
  );

-- Landing page
insert into public.schedule_template_items
  (template_id, name, phase, kind, estimated_duration_days, sort_order, predecessor_sort_order, lag_days)
select t.id, v.name, v.phase, v.kind, v.days, v.ord, v.pred, 0
from public.schedule_templates t
cross join (values
  ('Wireframe', 'planning', 'activity', 3, 0, null::int),
  ('Design UI', 'production', 'activity', 5, 1, 0),
  ('Desenvolvimento', 'production', 'activity', 7, 2, 1),
  ('QA e ajustes', 'review', 'activity', 3, 3, 2),
  ('Deploy', 'delivery', 'milestone', 1, 4, 3)
) as v(name, phase, kind, days, ord, pred)
where t.name = 'Landing page'
  and not exists (
    select 1 from public.schedule_template_items i where i.template_id = t.id
  );

-- Sistema web
insert into public.schedule_template_items
  (template_id, name, phase, kind, estimated_duration_days, sort_order, predecessor_sort_order, lag_days)
select t.id, v.name, v.phase, v.kind, v.days, v.ord, v.pred, 0
from public.schedule_templates t
cross join (values
  ('Discovery', 'planning', 'activity', 4, 0, null::int),
  ('Arquitetura e setup', 'planning', 'activity', 3, 1, 0),
  ('Sprint 1 — núcleo', 'production', 'activity', 10, 2, 1),
  ('Sprint 2 — features', 'production', 'activity', 10, 3, 2),
  ('QA e homologação', 'review', 'activity', 4, 4, 3),
  ('Deploy produção', 'delivery', 'milestone', 1, 5, 4)
) as v(name, phase, kind, days, ord, pred)
where t.name = 'Sistema web'
  and not exists (
    select 1 from public.schedule_template_items i where i.template_id = t.id
  );
