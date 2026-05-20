-- Catálogo global de etapas/entregáveis do estúdio (reutilizável em qualquer projeto)

create table if not exists public.studio_deliverable_catalog (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  deliverable_type  text not null default 'design'
                    check (deliverable_type in ('video', 'design', 'doc', 'code', 'link')),
  estimated_days    int not null default 3 check (estimated_days >= 1),
  professional_id   uuid references public.studio_professionals(id) on delete set null,
  predecessor_id    uuid references public.studio_deliverable_catalog(id) on delete set null,
  service_line      text
                    check (service_line is null or service_line in (
                      'branding', 'identity', 'content', 'web_design', 'web_dev', 'hybrid'
                    )),
  notes             text,
  sort_order        int not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint catalog_no_self_predecessor check (id is distinct from predecessor_id)
);

create index if not exists studio_deliverable_catalog_sort_idx
  on public.studio_deliverable_catalog (sort_order);

comment on table public.studio_deliverable_catalog is
  'Catálogo mestre de entregáveis/etapas — importado nos projetos.';

alter table public.studio_deliverable_catalog enable row level security;

drop policy if exists "admin all studio_deliverable_catalog" on public.studio_deliverable_catalog;
create policy "admin all studio_deliverable_catalog" on public.studio_deliverable_catalog
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());
