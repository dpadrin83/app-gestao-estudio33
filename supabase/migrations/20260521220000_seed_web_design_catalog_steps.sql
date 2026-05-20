-- Área: Soluções Digitais (sites, apps, sistemas)
-- UX/UI e gestão no início; DEV só após handoff do design.

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
    'Sites, apps e sistemas: domínio e UX/UI primeiro; desenvolvimento após aprovação do design.',
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
    raise exception 'Soluções Digitais: área não encontrada após insert.';
  end if;

  update public.deliverable_catalog_groups
  set
    name = 'Soluções Digitais',
    description = 'Sites, apps e sistemas: domínio e UX/UI primeiro; desenvolvimento após aprovação do design.',
    updated_at = now()
  where id = gid and lower(trim(name)) <> lower(trim('Soluções Digitais'));

  for r in
    select *
    from (values
      (0,  'Registro de domínio e DNS',              1, 'pm-orquestrador', 'web_design', 'link', 'Gestor: Registro.br/DNS. DEV entra só após handoff.'),
      (1,  'Hospedagem e contas (contratação)',      1, 'pm-orquestrador', 'web_design', 'doc',  'Gestor: Vercel/host, e-mails de acesso. Config técnica na etapa DEV.'),
      (2,  'Briefing digital e requisitos',          1, 'ui-ux-digital',   'web_design', 'doc',  'Site, app ou sistema — escopo e integrações.'),
      (3,  'Sitemap e arquitetura de informação',    2, 'ui-ux-digital',   'web_design', 'doc',  'Prompt: Sitemap + IA.'),
      (4,  'Wireframes (fluxos e páginas-chave)',     3, 'ui-ux-digital',   'web_design', 'design', 'Prompt: Wireframes.'),
      (5,  'UI e protótipo Figma',                   5, 'ui-ux-digital',   'web_design', 'design', 'Prompt: UI kit / protótipo.'),
      (6,  'Aprovação do design (cliente)',          1, 'pm-orquestrador', 'web_design', 'doc',  'Gestor: portal + OK registrado.'),
      (7,  'Handoff design → desenvolvimento',       1, 'ui-ux-digital',   'web_design', 'doc',  'Specs, tokens e assets — libera fase DEV.'),
      (8,  'Ambiente, repositório e stack',          2, 'arquiteto-dev',   'web_dev',    'code', '1ª etapa DEV: hospedagem técnica, repo, CI.'),
      (9,  'Implementação (site, app ou sistema)',   8, 'arquiteto-dev',   'web_dev',    'code', 'Código conforme escopo aprovado.'),
      (10, 'CMS, APIs e integrações',                3, 'arquiteto-dev',   'web_dev',    'code', 'Conteúdo, formulários e integrações.'),
      (11, 'SSL, performance e SEO técnico',         2, 'arquiteto-dev',   'web_dev',    'code', 'Prompt: SEO técnico + performance.'),
      (12, 'Testes e homologação',                   2, 'arquiteto-dev',   'web_dev',    'doc',  'Cross-browser, mobile e fluxos críticos.'),
      (13, 'Deploy e go-live',                       1, 'arquiteto-dev',   'web_dev',    'link', 'Produção no ar.'),
      (14, 'Entrega e treinamento ao cliente',       1, 'pm-orquestrador', 'web_dev',    'doc',  'Acessos, manual rápido, encerramento.')
    ) as v(sort_order, name, days, prof_slug, svc_line, dtype, notes)
  loop
    insert into public.studio_deliverable_catalog (
      group_id, name, deliverable_type, estimated_days,
      professional_id, predecessor_id, service_line, notes, sort_order
    )
    select
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
    where not exists (
      select 1 from public.studio_deliverable_catalog c
      where c.group_id = gid and lower(trim(c.name)) = lower(trim(r.name))
    )
    returning id into new_id;

    if new_id is not null then
      prev_id := new_id;
    else
      select c.id into new_id
      from public.studio_deliverable_catalog c
      where c.group_id = gid and lower(trim(c.name)) = lower(trim(r.name));

      if new_id is not null then
        update public.studio_deliverable_catalog
        set
          professional_id = case r.prof_slug
            when 'ui-ux-digital' then ui_id
            when 'pm-orquestrador' then pm_id
            else dev_id
          end,
          service_line = r.svc_line,
          estimated_days = r.days,
          notes = r.notes,
          deliverable_type = r.dtype,
          predecessor_id = coalesce(
            case when prev_id is not null then prev_id end,
            predecessor_id
          ),
          updated_at = now()
        where id = new_id;
      end if;

      prev_id := new_id;
    end if;
  end loop;

  -- Migrar nomes antigos da área Web Design
  update public.studio_deliverable_catalog c
  set
    name = 'Hospedagem e contas (contratação)',
    professional_id = pm_id,
    service_line = 'web_design',
    deliverable_type = 'doc',
    estimated_days = 1,
    notes = 'Gestor: Vercel/host, e-mails de acesso. Config técnica na etapa DEV.',
    updated_at = now()
  from public.deliverable_catalog_groups g
  where c.group_id = g.id
    and lower(trim(g.name)) in (lower(trim('Soluções Digitais')), lower(trim('Web Design')))
    and lower(trim(c.name)) = lower(trim('Hospedagem e ambientes'));

  update public.studio_deliverable_catalog c
  set
    name = 'Ambiente, repositório e stack',
    professional_id = dev_id,
    service_line = 'web_dev',
    estimated_days = 2,
    notes = '1ª etapa DEV: hospedagem técnica, repo, CI.',
    updated_at = now()
  from public.deliverable_catalog_groups g
  where c.group_id = g.id
    and lower(trim(g.name)) in (lower(trim('Soluções Digitais')), lower(trim('Web Design')))
    and lower(trim(c.name)) = lower(trim('Setup do projeto (repo e stack)'));

  update public.studio_deliverable_catalog c
  set
    name = 'Implementação (site, app ou sistema)',
    notes = 'Código conforme escopo aprovado.',
    updated_at = now()
  from public.deliverable_catalog_groups g
  where c.group_id = g.id
    and lower(trim(g.name)) in (lower(trim('Soluções Digitais')), lower(trim('Web Design')))
    and lower(trim(c.name)) = lower(trim('Implementação do site'));

  update public.studio_deliverable_catalog c
  set professional_id = pm_id, service_line = 'web_design', updated_at = now()
  from public.deliverable_catalog_groups g
  where c.group_id = g.id
    and lower(trim(g.name)) in (lower(trim('Soluções Digitais')), lower(trim('Web Design')))
    and lower(trim(c.name)) = lower(trim('Registro de domínio e DNS'))
    and c.professional_id = dev_id;
end $$;
