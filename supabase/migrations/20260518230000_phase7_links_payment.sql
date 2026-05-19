-- ====================================================================
-- Hub Estúdio 33 — Fase 7: links do projeto + payment_status já existe
-- ====================================================================

create table if not exists public.project_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  url         text not null,
  kind        text not null default 'link'
              check (kind in ('drive','figma','github','doc','link','other')),
  created_at  timestamptz not null default now()
);

create index if not exists project_links_project_idx on public.project_links (project_id);

alter table public.project_links enable row level security;

drop policy if exists "admin all on project_links" on public.project_links;
create policy "admin all on project_links" on public.project_links
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
