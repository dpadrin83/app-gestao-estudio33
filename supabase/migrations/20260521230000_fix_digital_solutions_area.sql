-- Corrige área Web Design → Soluções Digitais e move domínio/hospedagem para PM (DEV após handoff)

do $$
declare
  gid uuid;
  ui_id uuid;
  dev_id uuid;
  pm_id uuid;
begin
  select id into ui_id from public.studio_professionals where slug = 'ui-ux-digital' limit 1;
  select id into dev_id from public.studio_professionals where slug = 'arquiteto-dev' limit 1;
  select id into pm_id from public.studio_professionals where slug = 'pm-orquestrador' limit 1;

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) in (lower(trim('Web Design')), lower(trim('Soluções Digitais')))
  limit 1;

  if gid is null then
    return;
  end if;

  update public.deliverable_catalog_groups
  set
    name = 'Soluções Digitais',
    description = 'Sites, apps e sistemas: domínio e UX/UI primeiro; desenvolvimento após aprovação do design.',
    updated_at = now()
  where id = gid;

  update public.studio_deliverable_catalog
  set professional_id = pm_id, service_line = 'web_design', deliverable_type = 'link',
      notes = 'Gestor: Registro.br/DNS. DEV entra só após handoff.', updated_at = now()
  where group_id = gid and lower(trim(name)) = lower(trim('Registro de domínio e DNS'));

  update public.studio_deliverable_catalog
  set
    name = 'Hospedagem e contas (contratação)',
    professional_id = pm_id,
    service_line = 'web_design',
    deliverable_type = 'doc',
    estimated_days = 1,
    notes = 'Gestor: Vercel/host, e-mails de acesso. Config técnica na etapa DEV.',
    updated_at = now()
  where group_id = gid
    and lower(trim(name)) in (
      lower(trim('Hospedagem e ambientes')),
      lower(trim('Hospedagem e contas (contratação)'))
    );

  update public.studio_deliverable_catalog
  set
    name = 'Ambiente, repositório e stack',
    professional_id = dev_id,
    service_line = 'web_dev',
    estimated_days = 2,
    notes = '1ª etapa DEV: hospedagem técnica, repo, CI.',
    updated_at = now()
  where group_id = gid
    and lower(trim(name)) in (
      lower(trim('Setup do projeto (repo e stack)')),
      lower(trim('Ambiente, repositório e stack'))
    );

  update public.studio_deliverable_catalog
  set
    name = 'Implementação (site, app ou sistema)',
    notes = 'Código conforme escopo aprovado.',
    updated_at = now()
  where group_id = gid and lower(trim(name)) = lower(trim('Implementação do site'));

  update public.studio_deliverable_catalog
  set name = 'CMS, APIs e integrações', updated_at = now()
  where group_id = gid and lower(trim(name)) = lower(trim('CMS, conteúdo e formulários'));
end $$;
