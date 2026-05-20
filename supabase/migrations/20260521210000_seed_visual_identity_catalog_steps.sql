-- Área: Identidade Visual (prompts 19–28 + 00 Design System)

do $$
declare
  gid uuid;
  strat_id uuid;
  designer_id uuid;
  aplic_id uuid;
  pm_id uuid;
  prev_id uuid := null;
  new_id uuid;
  r record;
begin
  select id into strat_id from public.studio_professionals where slug = 'estrategista-marca' limit 1;
  select id into designer_id from public.studio_professionals where slug = 'designer-id-visual' limit 1;
  select id into aplic_id from public.studio_professionals where slug = 'designer-aplicacoes' limit 1;
  select id into pm_id from public.studio_professionals where slug = 'pm-orquestrador' limit 1;

  insert into public.deliverable_catalog_groups (name, description, sort_order)
  select
    'Identidade Visual',
    'Direção, conceito, sistema visual, design system, aplicações e lançamento (Prompts 19–28 e 00).',
    15
  where not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) = lower(trim('Identidade Visual'))
  );

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) = lower(trim('Identidade Visual'))
  limit 1;

  if gid is null then
    raise exception 'Identidade Visual: área não encontrada após insert.';
  end if;

  for r in
    select *
    from (values
      (0,  'Diretrizes de Identidade Visual',  2, 'estrategista-marca',  'doc',    'Prompt-19 Identidade Visual (diretrizes estratégicas)'),
      (1,  'Moodboards e Conceito',            2, 'designer-id-visual',  'design', 'Prompt-20 Moodboards'),
      (2,  'Símbolos e Logotipo',              4, 'designer-id-visual',  'design', 'Prompt-21 Símbolos e Logotipo'),
      (3,  'Paleta de Cores',                  2, 'designer-id-visual',  'design', 'Prompt-22 Paleta de Cores'),
      (4,  'Conjunto Tipográfico',             2, 'designer-id-visual',  'design', 'Prompt-23 Tipografia'),
      (5,  'Grafismos',                        2, 'designer-id-visual',  'design', 'Prompt-24 Grafismos'),
      (6,  'Direção de Imagem',                2, 'designer-id-visual',  'design', 'Prompt-25 Direção de Imagem'),
      (7,  'Manual Visual',                    4, 'designer-id-visual',  'doc',    'Prompt-26 Manual Visual'),
      (8,  'Design System (tokens)',           2, 'designer-id-visual',  'doc',    'Prompt-00 Design System'),
      (9,  'Aplicações da Marca',              3, 'designer-aplicacoes', 'design', 'Prompt-27 Aplicações'),
      (10, 'Lançamento da Marca',              2, 'pm-orquestrador',     'doc',    'Prompt-28 Lançamento. Gestor: cronograma de reveal e comunicação.')
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
        when 'estrategista-marca' then strat_id
        when 'designer-aplicacoes' then aplic_id
        when 'pm-orquestrador' then pm_id
        else designer_id
      end,
      prev_id,
      'identity',
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
