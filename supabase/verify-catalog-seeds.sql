-- Hub E33: teste do catálogo (cole ESTE arquivo inteiro no SQL Editor)
-- Se der erro na linha 1 com texto em português, você colou o arquivo errado.

-- CHECKLIST: 5 áreas esperadas (rode só este bloco se preferir)
with expected as (
  select * from (values
    (5,  'Onboarding',                      5,  '20260521180000_seed_onboarding_catalog_steps.sql'),
    (10, 'Branding e Estratégia de Marca', 18, '20260521190000_seed_branding_strategy_catalog_steps.sql'),
    (15, 'Identidade Visual',              11, '20260521210000_seed_visual_identity_catalog_steps.sql'),
    (20, 'Soluções Digitais',              20, '20260521240000_digital_solutions_detailed_steps.sql'),
    (25, 'Conteúdo, Copy e Roteiro',       17, '20260521270000_seed_content_copy_catalog_steps.sql')
  ) as v(sort_order, area_name, expected_steps, migration_file)
),
actual as (
  select g.name, count(c.id)::int as steps
  from public.deliverable_catalog_groups g
  left join public.studio_deliverable_catalog c on c.group_id = g.id
  group by g.id, g.name
)
select
  e.area_name as area_esperada,
  e.expected_steps as etapas_esperadas,
  coalesce(a.steps, 0) as etapas_no_banco,
  case
    when a.name is null then 'FALTA'
    when a.steps < e.expected_steps then 'INCOMPLETO'
    when a.steps = e.expected_steps then 'OK'
    else 'SOBRA'
  end as status,
  e.migration_file as rode_este_arquivo_se_falta
from expected e
left join actual a on lower(trim(a.name)) = lower(trim(e.area_name))
order by e.sort_order;
