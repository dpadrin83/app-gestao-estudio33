-- ====================================================================
-- Hub Estúdio 33 — Banco de prompts (catálogo, fora do plano por projeto)
-- Depende de studio_professionals (criada aqui se ainda não existir).
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

alter table public.studio_professionals enable row level security;

drop policy if exists "auth read studio_professionals" on public.studio_professionals;
create policy "auth read studio_professionals" on public.studio_professionals
  for select to authenticated using (true);

drop policy if exists "admin all studio_professionals" on public.studio_professionals;
create policy "admin all studio_professionals" on public.studio_professionals
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

create table if not exists public.prompt_templates (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid references public.studio_professionals(id) on delete set null,
  title            text not null,
  deliverable_hint text,
  body             text not null,
  variables        jsonb not null default '[]'::jsonb,
  version          int not null default 1,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists prompt_templates_professional_idx
  on public.prompt_templates (professional_id, is_active);

comment on table public.prompt_templates is
  'Catálogo de prompts reutilizáveis. Uso: copiar para IA ou vincular depois a entregáveis.';

alter table public.prompt_templates enable row level security;

drop policy if exists "auth read prompt_templates" on public.prompt_templates;
create policy "auth read prompt_templates" on public.prompt_templates
  for select to authenticated using (true);

drop policy if exists "admin all prompt_templates" on public.prompt_templates;
create policy "admin all prompt_templates" on public.prompt_templates
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

-- Exemplos iniciais (só se tabela vazia)
insert into public.prompt_templates (professional_id, title, deliverable_hint, body, variables)
select p.id, v.title, v.hint, v.body, v.vars::jsonb
from (values
  (
    'estrategista-marca',
    'Prompt mestre — Estrategista',
    null,
    'Você é estrategista de marca do Estúdio 33. Cliente: [CLIENTE]. Segmento: [SEGMENTO]. Tom: [TOM]. Entregável atual: [ENTREGAVEL].',
    '["CLIENTE","SEGMENTO","TOM","ENTREGAVEL"]'
  ),
  (
    'estrategista-marca',
    'Análise SWOT',
    'Análise SWOT',
    'Analise [CLIENTE] no segmento [SEGMENTO]. Matriz SWOT com 5 itens por quadrante, linguagem executiva. Formato: tabela + 3 implicações estratégicas.',
    '["CLIENTE","SEGMENTO"]'
  ),
  (
    'copywriter',
    'Prompt mestre — Copy',
    null,
    'Copywriter E33. Cliente [CLIENTE]. Tom [TOM]. Briefing: [BRIEFING]. Tarefa: [ENTREGAVEL].',
    '["CLIENTE","TOM","BRIEFING","ENTREGAVEL"]'
  ),
  (
    'designer-aplicacoes',
    'Assinatura de e-mail',
    'Assinatura de e-mail',
    'Crie assinatura de e-mail institucional para [CLIENTE], respeitando manual de marca. Incluir nome, cargo, telefone, site. Formato HTML simples compatível com Gmail/Outlook.',
    '["CLIENTE"]'
  )
) as v(slug, title, hint, body, vars)
join public.studio_professionals p on p.slug = v.slug
where not exists (select 1 from public.prompt_templates limit 1);
