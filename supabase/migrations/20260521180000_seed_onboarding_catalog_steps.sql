-- Área Onboarding: 5 etapas (comercial + briefing até aprovação para produção)
-- Gestor: cadastro Hub, portal, Gantt — fora do catálogo.

do $$
declare
  gid uuid;
  pm_id uuid;
  s1 uuid;
  s2 uuid;
  s3 uuid;
  s4 uuid;
begin
  select id into pm_id
  from public.studio_professionals
  where slug = 'pm-orquestrador'
  limit 1;

  insert into public.deliverable_catalog_groups (name, description, sort_order)
  select
    'Onboarding',
    'Comercial e alinhamento até o cliente aprovar e o projeto ir para produção.',
    5
  where not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) = 'onboarding'
  );

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) = 'onboarding'
  limit 1;

  if gid is null then
    raise exception 'Onboarding: área não encontrada após insert.';
  end if;

  -- 1. Qualificação do lead
  insert into public.studio_deliverable_catalog (
    group_id, name, deliverable_type, estimated_days,
    professional_id, predecessor_id, service_line, notes, sort_order
  )
  select
    gid, 'Qualificação do lead', 'doc', 1,
    pm_id, null, 'hybrid',
    'Prompt: Qualificação de lead. Gestor: registrar decisão no Hub.',
    0
  where not exists (
    select 1 from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'qualificação do lead'
  )
  returning id into s1;

  if s1 is null then
    select c.id into s1
    from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'qualificação do lead';
  end if;

  -- 2. Proposta comercial
  insert into public.studio_deliverable_catalog (
    group_id, name, deliverable_type, estimated_days,
    professional_id, predecessor_id, service_line, notes, sort_order
  )
  select
    gid, 'Proposta comercial', 'doc', 2,
    pm_id, s1, 'hybrid',
    'Prompt: Proposta comercial. Gestor: enviar e registrar aceite.',
    1
  where not exists (
    select 1 from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'proposta comercial'
  )
  returning id into s2;

  if s2 is null then
    select c.id into s2
    from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'proposta comercial';
  end if;

  -- 3. Contrato assinado
  insert into public.studio_deliverable_catalog (
    group_id, name, deliverable_type, estimated_days,
    professional_id, predecessor_id, service_line, notes, sort_order
  )
  select
    gid, 'Contrato assinado', 'doc', 1,
    pm_id, s2, 'hybrid',
    'Prompt: Minuta de contrato (opcional). Gestor: coleta assinatura e abre projeto no Hub.',
    2
  where not exists (
    select 1 from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'contrato assinado'
  )
  returning id into s3;

  if s3 is null then
    select c.id into s3
    from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'contrato assinado';
  end if;

  -- 4. Briefing + kickoff
  insert into public.studio_deliverable_catalog (
    group_id, name, deliverable_type, estimated_days,
    professional_id, predecessor_id, service_line, notes, sort_order
  )
  select
    gid, 'Briefing + kickoff', 'doc', 2,
    pm_id, s3, 'hybrid',
    'Prompt: Briefing estruturado (inclui pauta/ata). Gestor: portal, plano macro e Gantt.',
    3
  where not exists (
    select 1 from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'briefing + kickoff'
  )
  returning id into s4;

  if s4 is null then
    select c.id into s4
    from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'briefing + kickoff';
  end if;

  -- 5. Aprovação para produção
  insert into public.studio_deliverable_catalog (
    group_id, name, deliverable_type, estimated_days,
    professional_id, predecessor_id, service_line, notes, sort_order
  )
  select
    gid, 'Aprovação para produção', 'doc', 1,
    pm_id, s4, 'hybrid',
    'Prompt: Alinhamento revisões/prazos. Gestor: status do projeto → produção no Hub.',
    4
  where not exists (
    select 1 from public.studio_deliverable_catalog c
    where c.group_id = gid and lower(trim(c.name)) = 'aprovação para produção'
  );

  -- Garantir cadeia de dependências se etapas já existiam
  update public.studio_deliverable_catalog
  set predecessor_id = s1, updated_at = now()
  where group_id = gid and id = s2 and predecessor_id is distinct from s1;

  update public.studio_deliverable_catalog
  set predecessor_id = s2, updated_at = now()
  where group_id = gid and id = s3 and predecessor_id is distinct from s2;

  update public.studio_deliverable_catalog
  set predecessor_id = s3, updated_at = now()
  where group_id = gid and id = s4 and predecessor_id is distinct from s3;

  update public.studio_deliverable_catalog
  set predecessor_id = s4, updated_at = now()
  where group_id = gid
    and lower(trim(name)) = 'aprovação para produção'
    and predecessor_id is distinct from s4;
end $$;
