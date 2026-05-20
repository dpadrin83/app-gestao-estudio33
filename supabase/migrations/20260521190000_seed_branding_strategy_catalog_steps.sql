-- Área: Branding e Estratégia de Marca (prompts 01–18)
-- Identidade visual (19+) fica em área(s) separadas depois.

do $$
declare
  gid uuid;
  strat_id uuid;
  growth_id uuid;
  prev_id uuid := null;
  new_id uuid;
  r record;
begin
  select id into strat_id
  from public.studio_professionals
  where slug = 'estrategista-marca'
  limit 1;

  select id into growth_id
  from public.studio_professionals
  where slug = 'growth-trafego'
  limit 1;

  insert into public.deliverable_catalog_groups (name, description, sort_order)
  select
    'Branding e Estratégia de Marca',
    'Diagnóstico, posicionamento, estratégia digital, personalidade e identidade verbal (Prompts 01–18).',
    10
  where not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) in (
      lower(trim('Branding e Estratégia de Marca')),
      lower(trim('Branding e estratégias digital ou de marca'))
    )
  );

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) in (
    lower(trim('Branding e Estratégia de Marca')),
    lower(trim('Branding e estratégias digital ou de marca'))
  )
  order by case
    when lower(trim(name)) = lower(trim('Branding e Estratégia de Marca')) then 0
    else 1
  end
  limit 1;

  if gid is null then
    raise exception 'Branding: área não encontrada após insert.';
  end if;

  for r in
    select *
    from (values
      (0,  'Auditoria de Mercado',                    2, 'estrategista-marca', 'Prompt-01 Auditoria de Mercado'),
      (1,  'Auditoria de Público',                    2, 'estrategista-marca', 'Prompt-02 Auditoria de Público'),
      (2,  'Auditoria de Negócio',                    2, 'estrategista-marca', 'Prompt-03 Auditoria de Negócio'),
      (3,  'Benchmarking de Comunicação',            2, 'estrategista-marca', 'Prompt-04 Benchmarking'),
      (4,  'Plataforma de Posicionamento',           3, 'estrategista-marca', 'Prompt-05 Posicionamento'),
      (5,  'Golden Circle',                          1, 'estrategista-marca', 'Prompt-06 Golden Circle'),
      (6,  'Plano de Mídia e Pontos de Contato',     2, 'growth-trafego',     'Prompt-07 Plano de Mídia (estratégia digital)'),
      (7,  'Buyer Persona',                          2, 'estrategista-marca', 'Prompt-08 Buyer Persona'),
      (8,  'Núcleo da Marca (Brand DNA)',            2, 'estrategista-marca', 'Prompt-09 Núcleo da Marca'),
      (9,  'Roteiro da Marca',                       1, 'estrategista-marca', 'Prompt-10 Roteiro da Marca'),
      (10, 'Virtudes e Sombras da Marca',            1, 'estrategista-marca', 'Prompt-11 Virtudes'),
      (11, 'Arquétipos da Marca',                    1, 'estrategista-marca', 'Prompt-12 Arquétipos'),
      (12, 'Brand Persona',                          1, 'estrategista-marca', 'Prompt-13 Brand Persona'),
      (13, 'Tom e Voz',                              2, 'estrategista-marca', 'Prompt-14 Tom e Voz'),
      (14, 'Naming',                                 2, 'estrategista-marca', 'Prompt-15 Naming'),
      (15, 'Vocabulário da Marca',                   1, 'estrategista-marca', 'Prompt-16 Vocabulário'),
      (16, 'Manifesto de Marca',                     1, 'estrategista-marca', 'Prompt-17 Manifesto'),
      (17, 'Manual Verbal',                          2, 'estrategista-marca', 'Prompt-18 Manual Verbal')
    ) as v(sort_order, name, days, prof_slug, notes)
  loop
    insert into public.studio_deliverable_catalog (
      group_id, name, deliverable_type, estimated_days,
      professional_id, predecessor_id, service_line, notes, sort_order
    )
    select
      gid,
      r.name,
      'doc',
      r.days,
      case when r.prof_slug = 'growth-trafego' then growth_id else strat_id end,
      prev_id,
      'branding',
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
