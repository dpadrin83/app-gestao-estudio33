-- ====================================================================
-- Hub Estúdio 33 — Fase 4: IA (histórico) + briefing no projeto
-- ====================================================================

alter table public.projects
  add column if not exists briefing_notes text;

create table if not exists public.ai_generations (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  kind        text not null check (kind in ('weekly_summary','schedule_suggestion','smart_insights','briefing_import')),
  content     text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists ai_generations_project_idx on public.ai_generations (project_id, created_at desc);
create index if not exists ai_generations_kind_idx on public.ai_generations (kind);

alter table public.ai_generations enable row level security;

drop policy if exists "admin all on ai_generations" on public.ai_generations;
create policy "admin all on ai_generations" on public.ai_generations
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
