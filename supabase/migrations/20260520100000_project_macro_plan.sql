-- ====================================================================
-- Hub Estúdio 33 — Plano por área macro (profissionais E33 + itens)
-- ====================================================================

create table if not exists public.studio_professionals (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  service_line text
    check (service_line is null or service_line in (
      'branding', 'identity', 'content', 'web_design', 'web_dev', 'hybrid'
    )),
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table public.studio_professionals is
  'Catálogo fixo dos papéis E33 (lista consolidada).';

insert into public.studio_professionals (slug, name, service_line, sort_order) values
  ('estrategista-marca', 'Estrategista de marca', 'branding', 1),
  ('designer-id-visual', 'Designer identidade visual', 'identity', 2),
  ('designer-aplicacoes', 'Designer de aplicações', 'identity', 3),
  ('designer-presenca-digital', 'Designer presença digital', 'content', 4),
  ('copywriter', 'Copywriter / conteúdo', 'content', 5),
  ('designer-pecas', 'Designer de peças', 'content', 6),
  ('motion-video', 'Motion / vídeo', 'content', 7),
  ('ui-ux-digital', 'UI/UX digital', 'web_design', 8),
  ('arquiteto-dev', 'Arquiteto / DEV', 'web_dev', 9),
  ('growth-trafego', 'Growth / tráfego', 'hybrid', 10),
  ('pm-orquestrador', 'PM / orquestrador', 'hybrid', 11)
on conflict (slug) do update set
  name = excluded.name,
  service_line = excluded.service_line,
  sort_order = excluded.sort_order;

create table if not exists public.project_macro_areas (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  name             text not null,
  professional_id  uuid references public.studio_professionals(id) on delete set null,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists project_macro_areas_project_idx
  on public.project_macro_areas (project_id, sort_order);

create table if not exists public.project_work_items (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  macro_area_id    uuid references public.project_macro_areas(id) on delete set null,
  item_type        text not null default 'sub_etapa'
    check (item_type in ('sub_etapa', 'entregavel')),
  name             text not null,
  professional_id  uuid not null references public.studio_professionals(id),
  estimated_days   int not null default 1 check (estimated_days >= 0),
  deliverable_id   uuid references public.deliverables(id) on delete set null,
  prompt_notes     text,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists project_work_items_project_idx
  on public.project_work_items (project_id, macro_area_id, sort_order);

alter table public.studio_professionals enable row level security;
alter table public.project_macro_areas enable row level security;
alter table public.project_work_items enable row level security;

drop policy if exists "auth read studio_professionals" on public.studio_professionals;
create policy "auth read studio_professionals" on public.studio_professionals
  for select to authenticated using (true);

drop policy if exists "admin all studio_professionals" on public.studio_professionals;
create policy "admin all studio_professionals" on public.studio_professionals
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

drop policy if exists "admin all project_macro_areas" on public.project_macro_areas;
create policy "admin all project_macro_areas" on public.project_macro_areas
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

drop policy if exists "admin all project_work_items" on public.project_work_items;
create policy "admin all project_work_items" on public.project_work_items
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());
