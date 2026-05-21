-- Playbook de execução (checklist micro) por etapa do plano — não altera catálogo nem Gantt.
-- Acessos do projeto: links + credenciais (só Hub admin, nunca portal do cliente).

alter table public.project_deliverable_plan_items
  add column if not exists execution_checklist jsonb not null default '[]'::jsonb;

comment on column public.project_deliverable_plan_items.execution_checklist is
  'Checklist de execução (micro-passos). Independente das dependências macro do plano/Gantt.';

-- project_links: URL opcional + usuário/senha para Supabase, Vercel, etc.
alter table public.project_links
  alter column url drop not null;

alter table public.project_links
  add column if not exists username text,
  add column if not exists secret_note text;

alter table public.project_links
  drop constraint if exists project_links_kind_check;

alter table public.project_links
  add constraint project_links_kind_check
  check (kind in (
    'drive', 'figma', 'github', 'doc', 'link', 'other',
    'supabase', 'vercel', 'cursor', 'hosting', 'credential'
  ));

alter table public.project_links
  drop constraint if exists project_links_has_content;

alter table public.project_links
  add constraint project_links_has_content check (
    coalesce(nullif(trim(url), ''), '') <> ''
    or coalesce(nullif(trim(secret_note), ''), '') <> ''
  );

comment on column public.project_links.secret_note is
  'Senha, API key ou nota sensível — visível só no Hub (admin). Não replicar no portal do cliente.';
