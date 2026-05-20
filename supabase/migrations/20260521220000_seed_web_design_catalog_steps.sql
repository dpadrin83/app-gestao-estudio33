-- Área: Web Design — domínio, hospedagem, UI/UX, desenvolvimento e entrega do site

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
    'Web Design',
    'Domínio, hospedagem, UX/UI, implementação, testes e entrega do site.',
    20
  where not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) = lower(trim('Web Design'))
  );

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) = lower(trim('Web Design'))
  limit 1;

  if gid is null then
    raise exception 'Web Design: área não encontrada após insert.';
  end if;

  for r in
    select *
    from (values
      (0,  'Registro de domínio e DNS',           1, 'arquiteto-dev',  'link', 'Gestor: Registro.br ou registrador. Prompt: Checklist domínio e DNS.'),
      (1,  'Hospedagem e ambientes',            2, 'arquiteto-dev',  'code', 'Staging + produção (Vercel/host). Depende de DNS propagado.'),
      (2,  'Briefing digital e requisitos',     1, 'ui-ux-digital',  'doc',  'Escopo de páginas, integrações e conteúdo.'),
      (3,  'Sitemap e arquitetura de informação', 2, 'ui-ux-digital',  'doc',  'Prompt: Sitemap + IA.'),
      (4,  'Wireframes (páginas-chave)',        3, 'ui-ux-digital',  'design', 'Prompt: Wireframe landing/institucional.'),
      (5,  'UI e protótipo Figma',              5, 'ui-ux-digital',  'design', 'Prompt: UI kit / protótipo responsivo.'),
      (6,  'Aprovação do design (cliente)',     1, 'pm-orquestrador', 'doc',  'Gestor: enviar no portal e registrar OK.'),
      (7,  'Handoff design → desenvolvimento',  1, 'ui-ux-digital',  'doc',  'Specs, tokens, assets exportados.'),
      (8,  'Setup do projeto (repo e stack)',   1, 'arquiteto-dev',  'code', 'Prompt: PRD técnico / stack.'),
      (9,  'Implementação do site',             8, 'arquiteto-dev',  'code', 'Front-end + integrações acordadas.'),
      (10, 'CMS, conteúdo e formulários',      3, 'arquiteto-dev',  'code', 'População inicial e testes de envio.'),
      (11, 'SSL, performance e SEO técnico',   2, 'arquiteto-dev',  'code', 'Prompt: SEO técnico + performance.'),
      (12, 'Testes e homologação',              2, 'arquiteto-dev',  'doc',  'Checklist cross-browser e mobile.'),
      (13, 'Deploy e go-live',                  1, 'arquiteto-dev',  'link', 'Produção publicada + monitoração básica.'),
      (14, 'Entrega e treinamento ao cliente',  1, 'pm-orquestrador', 'doc', 'Acesso admin, manual rápido, encerramento.')
    ) as v(sort_order, name, days, prof_slug, dtype, notes)
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
      case
        when r.prof_slug = 'ui-ux-digital' then 'web_design'
        else 'web_dev'
      end,
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

      if new_id is not null and prev_id is not null then
        update public.studio_deliverable_catalog
        set predecessor_id = prev_id, updated_at = now()
        where id = new_id and predecessor_id is distinct from prev_id;
      end if;

      prev_id := new_id;
    end if;
  end loop;
end $$;
