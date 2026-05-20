-- Soluções Digitais: etapas internas; cliente só aprova versões finalizadas (2 gates)

do $$
declare
  gid uuid;
begin
  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) = lower(trim('Soluções Digitais'))
  limit 1;

  if gid is null then
    return;
  end if;

  update public.deliverable_catalog_groups
  set description = 'Sites, apps e sistemas. [INTERNO] até versão final; cliente aprova design final e homologação em staging.',
      updated_at = now()
  where id = gid;

  -- Etapas 1–8 e 10–16, 18–19: interno
  update public.studio_deliverable_catalog
  set notes = '[INTERNO] ' || coalesce(nullif(trim(replace(notes, '[INTERNO] ', '')), ''), notes),
      updated_at = now()
  where group_id = gid
    and sort_order between 0 and 8
    and notes not like '[INTERNO]%';

  update public.studio_deliverable_catalog
  set notes = '[INTERNO] ' || coalesce(nullif(trim(replace(replace(notes, '[INTERNO] ', ''), '[APROVAÇÃO CLIENTE] ', '')), ''), notes),
      updated_at = now()
  where group_id = gid
    and sort_order between 10 and 16
    and notes not like '[INTERNO]%';

  update public.studio_deliverable_catalog
  set notes = '[INTERNO] ' || coalesce(nullif(trim(replace(notes, '[INTERNO] ', '')), ''), notes),
      updated_at = now()
  where group_id = gid
    and sort_order in (18, 19)
    and notes not like '[INTERNO]%';

  -- Gate 1: design final (Figma + HTML fechados)
  update public.studio_deliverable_catalog
  set
    name = 'Aprovação do cliente — design digital final',
    notes = '[APROVAÇÃO CLIENTE] Enviar Figma + protótipo HTML finalizados no portal. Sem WIP.',
    updated_at = now()
  where group_id = gid
    and (
      lower(trim(name)) like '%aprovação%design%'
      or sort_order = 8
    );

  -- Gate 2: homologação (antes do go-live)
  update public.studio_deliverable_catalog
  set
    name = 'Homologação do cliente (staging)',
    estimated_days = 2,
    notes = '[APROVAÇÃO CLIENTE] URL de staging; versão final para validar. Ajustes finos só se couber no escopo.',
    updated_at = now()
  where group_id = gid
    and lower(trim(name)) in (
      lower(trim('Testes e homologação')),
      lower(trim('Homologação do cliente (staging)'))
    );

  -- Handoff e entrega: interno com gestor
  update public.studio_deliverable_catalog
  set notes = '[INTERNO] Assets, tokens, PRD final — libera fase DEV. Cliente já aprovou design.',
      updated_at = now()
  where group_id = gid and sort_order = 9;

  update public.studio_deliverable_catalog
  set notes = '[INTERNO] Gestor: acessos e manual. Cliente já validou em homologação.',
      updated_at = now()
  where group_id = gid and sort_order = 19;
end $$;
