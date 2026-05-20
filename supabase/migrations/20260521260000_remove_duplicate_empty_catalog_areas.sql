-- Remove as 7 áreas vazias da migration 211700 (substituídas pelas 4 áreas com etapas).
-- Mantém: Onboarding, Branding e Estratégia de Marca, Identidade Visual, Soluções Digitais.

delete from public.studio_deliverable_catalog c
using public.deliverable_catalog_groups g
where c.group_id = g.id
  and lower(trim(g.name)) in (
    lower(trim('Diagnóstico')),
    lower(trim('Estratégia de marca')),
    lower(trim('Personalidade da marca')),
    lower(trim('Identidade verbal')),
    lower(trim('Identidade visual — direção')),
    lower(trim('Identidade visual — sistema')),
    lower(trim('Aplicações e lançamento'))
  );

delete from public.deliverable_catalog_groups g
where lower(trim(g.name)) in (
  lower(trim('Diagnóstico')),
  lower(trim('Estratégia de marca')),
  lower(trim('Personalidade da marca')),
  lower(trim('Identidade verbal')),
  lower(trim('Identidade visual — direção')),
  lower(trim('Identidade visual — sistema')),
  lower(trim('Aplicações e lançamento'))
);
