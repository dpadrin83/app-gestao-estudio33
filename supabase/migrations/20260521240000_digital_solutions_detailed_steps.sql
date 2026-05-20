-- Soluções Digitais: fluxo detalhado (PRD, HTML teste, stack, DEV após handoff)
-- Recria etapas do catálogo nesta área (não altera planos já importados em projetos).

do $$
declare
  gid uuid;
  ui_id uuid;
  dev_id uuid;
  pm_id uuid;
  prev_id uuid := null;
  new_id uuid;
  r record;
begin
  select id into ui_id from public.studio_professionals where slug = 'ui-ux-digital' limit 1;
  select id into dev_id from public.studio_professionals where slug = 'arquiteto-dev' limit 1;
  select id into pm_id from public.studio_professionals where slug = 'pm-orquestrador' limit 1;

  insert into public.deliverable_catalog_groups (name, description, sort_order)
  select
    'Soluções Digitais',
    'Sites, apps e sistemas. Interno até versão final; cliente aprova design final e homologação em staging.',
    20
  where not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) in (
      lower(trim('Soluções Digitais')),
      lower(trim('Web Design'))
    )
  );

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) in (
    lower(trim('Soluções Digitais')),
    lower(trim('Web Design'))
  )
  order by case when lower(trim(name)) = lower(trim('Soluções Digitais')) then 0 else 1 end
  limit 1;

  if gid is null then
    raise exception 'Soluções Digitais: área não encontrada.';
  end if;

  update public.deliverable_catalog_groups
  set
    name = 'Soluções Digitais',
    description = 'Sites, apps e sistemas: PRD, protótipo HTML, UX/UI, depois GitHub/Supabase/Vercel e desenvolvimento.',
    updated_at = now()
  where id = gid;

  delete from public.studio_deliverable_catalog where group_id = gid;

  for r in
    select *
    from (values
      -- Gestor / PM (antes do design)
      (0,  'Registro de domínio e DNS',                 1, 'pm-orquestrador', 'web_design', 'link',
        '[INTERNO] Gestor: Registro.br, DNS, apontamentos.'),
      (1,  'Hospedagem e contas (contratação)',         1, 'pm-orquestrador', 'web_design', 'doc',
        '[INTERNO] Gestor: contas Vercel/host e acessos no Hub.'),

      -- UX/UI + produto (sem DEV) — tudo interno até versão final
      (2,  'Briefing digital e requisitos',             1, 'ui-ux-digital',   'web_design', 'doc',
        '[INTERNO] Escopo site, app ou sistema.'),
      (3,  'PRD digital',                               2, 'ui-ux-digital',   'web_design', 'doc',
        '[INTERNO] Prompt: PRD produto. Briefing Studio.'),
      (4,  'Sitemap e arquitetura de informação',       1, 'ui-ux-digital',   'web_design', 'doc',
        '[INTERNO] Mapa de páginas e navegação.'),
      (5,  'Wireframes (fluxos e telas-chave)',         2, 'ui-ux-digital',   'web_design', 'design',
        '[INTERNO] Baixa fidelidade — não enviar WIP ao cliente.'),
      (6,  'UI e protótipo Figma',                      4, 'ui-ux-digital',   'web_design', 'design',
        '[INTERNO] Alta fidelidade — versão final na etapa de aprovação.'),
      (7,  'Protótipo HTML de teste',                   2, 'ui-ux-digital',   'web_design', 'code',
        '[INTERNO] HTML navegável final junto com Figma para aprovação.'),
      (8,  'Aprovação do cliente — design digital final', 1, 'pm-orquestrador', 'web_design', 'doc',
        '[APROVAÇÃO CLIENTE] Portal: Figma + HTML finalizados. Sem rascunhos.'),
      (9,  'Handoff design → desenvolvimento',          1, 'ui-ux-digital',   'web_design', 'doc',
        '[INTERNO] Assets, tokens, PRD — libera DEV após OK do cliente.'),

      -- DEV: ferramentas e preparação (tudo interno)
      (10, 'Configuração GitHub (repositório)',         1, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] Repo, branches, README.'),
      (11, 'Configuração Supabase (projeto e base)',    1, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] Projeto, auth, DB, RLS.'),
      (12, 'Configuração Vercel (deploy e domínio)',    1, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] Projeto Vercel, env, domínio.'),
      (13, 'Preparação do ambiente de desenvolvimento', 2, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] Next.js, CI, estrutura, env local.'),
      (14, 'Implementação (site, app ou sistema)',      8, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] Código de produção.'),
      (15, 'CMS, APIs e integrações',                   3, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] Painéis, formulários, integrações.'),
      (16, 'SSL, performance e SEO técnico',            2, 'arquiteto-dev',   'web_dev',    'code',
        '[INTERNO] QA técnico antes de staging.'),
      (17, 'Homologação do cliente (staging)',          2, 'pm-orquestrador', 'web_dev',    'doc',
        '[APROVAÇÃO CLIENTE] URL staging — versão final. Testes internos já feitos.'),
      (18, 'Deploy e go-live',                          1, 'arquiteto-dev',   'web_dev',    'link',
        '[INTERNO] Produção após OK em homologação.'),
      (19, 'Entrega e treinamento ao cliente',          1, 'pm-orquestrador', 'web_dev',    'doc',
        '[INTERNO] Acessos e manual — cliente já validou em staging.')
    ) as v(sort_order, name, days, prof_slug, svc_line, dtype, notes)
  loop
    insert into public.studio_deliverable_catalog (
      group_id, name, deliverable_type, estimated_days,
      professional_id, predecessor_id, service_line, notes, sort_order
    )
    values (
      gid,
      r.name,
      r.dtype,
      r.days,
      case r.prof_slug
        when 'ui-ux-digital' then ui_id
        when 'pm-orquestrador' then pm_id
        else dev_id
      end,
      prev_id,
      r.svc_line,
      r.notes,
      r.sort_order
    )
    returning id into new_id;

    prev_id := new_id;
  end loop;
end $$;
