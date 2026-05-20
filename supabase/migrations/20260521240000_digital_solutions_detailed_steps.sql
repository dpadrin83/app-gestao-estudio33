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
    'Sites, apps e sistemas: PRD, protótipo HTML, UX/UI, depois GitHub/Supabase/Vercel e desenvolvimento.',
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
        'Gestor: Registro.br, DNS, apontamentos.'),
      (1,  'Hospedagem e contas (contratação)',         1, 'pm-orquestrador', 'web_design', 'doc',
        'Gestor: abrir contas Vercel/host e guardar acessos no Hub.'),

      -- UX/UI + produto (sem DEV)
      (2,  'Briefing digital e requisitos',             1, 'ui-ux-digital',   'web_design', 'doc',
        'Site, app ou sistema — objetivo, integrações, conteúdo.'),
      (3,  'PRD digital',                               2, 'ui-ux-digital',   'web_design', 'doc',
        'Prompt: PRD produto (páginas, fluxos, regras, fora de escopo). Briefing Studio.'),
      (4,  'Sitemap e arquitetura de informação',       1, 'ui-ux-digital',   'web_design', 'doc',
        'Mapa de páginas e navegação.'),
      (5,  'Wireframes (fluxos e telas-chave)',         2, 'ui-ux-digital',   'web_design', 'design',
        'Baixa fidelidade — validar fluxo antes do visual.'),
      (6,  'UI e protótipo Figma',                      4, 'ui-ux-digital',   'web_design', 'design',
        'Alta fidelidade responsiva.'),
      (7,  'Protótipo HTML de teste',                   2, 'ui-ux-digital',   'web_design', 'code',
        'Versão navegável em HTML/CSS (ou export Figma) para validar antes do código real.'),
      (8,  'Aprovação do design e do protótipo',        1, 'pm-orquestrador', 'web_design', 'doc',
        'Gestor: enviar ao cliente (portal) e registrar aprovação.'),
      (9,  'Handoff design → desenvolvimento',          1, 'ui-ux-digital',   'web_design', 'doc',
        'Assets, tokens, PRD final e critérios de aceite — libera fase DEV.'),

      -- DEV: ferramentas e preparação
      (10, 'Configuração GitHub (repositório)',         1, 'arquiteto-dev',   'web_dev',    'code',
        'Repo privado, branches, README, .gitignore.'),
      (11, 'Configuração Supabase (projeto e base)',    1, 'arquiteto-dev',   'web_dev',    'code',
        'Projeto, auth, tabelas iniciais, RLS se aplicável.'),
      (12, 'Configuração Vercel (deploy e domínio)',    1, 'arquiteto-dev',   'web_dev',    'code',
        'Projeto Vercel, variáveis de ambiente, domínio customizado.'),
      (13, 'Preparação do ambiente de desenvolvimento', 2, 'arquiteto-dev',   'web_dev',    'code',
        'Next.js (ou stack definida), CI, estrutura de pastas, env local.'),
      (14, 'Implementação (site, app ou sistema)',      8, 'arquiteto-dev',   'web_dev',    'code',
        'Código de produção conforme PRD e design aprovados.'),
      (15, 'CMS, APIs e integrações',                   3, 'arquiteto-dev',   'web_dev',    'code',
        'Painéis, formulários, webhooks, APIs de terceiros.'),
      (16, 'SSL, performance e SEO técnico',            2, 'arquiteto-dev',   'web_dev',    'code',
        'HTTPS, Core Web Vitals, meta técnico, sitemap.'),
      (17, 'Testes e homologação',                      2, 'arquiteto-dev',   'web_dev',    'doc',
        'Fluxos críticos, mobile, cross-browser.'),
      (18, 'Deploy e go-live',                          1, 'arquiteto-dev',   'web_dev',    'link',
        'Produção publicada e monitoração básica.'),
      (19, 'Entrega e treinamento ao cliente',          1, 'pm-orquestrador', 'web_dev',    'doc',
        'Acessos admin, manual rápido, encerramento.')
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
