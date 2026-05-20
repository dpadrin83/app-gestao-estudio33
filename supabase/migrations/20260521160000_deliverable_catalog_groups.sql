-- Áreas do catálogo (Onboarding, Identidade, Site…) com etapas dentro

create table if not exists public.deliverable_catalog_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists deliverable_catalog_groups_name_idx
  on public.deliverable_catalog_groups (lower(trim(name)));

alter table public.studio_deliverable_catalog
  add column if not exists group_id uuid
  references public.deliverable_catalog_groups(id) on delete cascade;

create index if not exists studio_deliverable_catalog_group_idx
  on public.studio_deliverable_catalog (group_id);

comment on table public.deliverable_catalog_groups is
  'Áreas do catálogo de entregáveis (ex.: Onboarding, Produção, Entrega).';

alter table public.deliverable_catalog_groups enable row level security;

drop policy if exists "admin all deliverable_catalog_groups" on public.deliverable_catalog_groups;
create policy "admin all deliverable_catalog_groups" on public.deliverable_catalog_groups
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());
