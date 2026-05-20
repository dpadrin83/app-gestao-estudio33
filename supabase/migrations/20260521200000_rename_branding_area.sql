-- Renomeia área criada com nome longo → Branding e Estratégia de Marca

update public.deliverable_catalog_groups
set
  name = 'Branding e Estratégia de Marca',
  updated_at = now()
where lower(trim(name)) = lower(trim('Branding e estratégias digital ou de marca'))
  and not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) = lower(trim('Branding e Estratégia de Marca'))
      and g.id <> deliverable_catalog_groups.id
  );
