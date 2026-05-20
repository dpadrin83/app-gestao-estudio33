-- ====================================================================
-- Hub Estúdio 33 — Verificar se todas as migrations foram aplicadas
-- Cole no Supabase → SQL Editor → Run (uma query só)
-- ====================================================================

with expected_tables as (
  select unnest(array[
    'clients', 'projects', 'time_sessions',
    'activities', 'activity_dependencies',
    'schedule_templates', 'schedule_template_items',
    'schedule_template_deliverables',
    'deliverables', 'deliverable_versions', 'deliverable_comments',
    'project_costs', 'app_settings',
    'ai_generations', 'tasks', 'project_links',
    'studio_professionals', 'project_macro_areas', 'project_work_items',
    'prompt_templates', 'client_services', 'client_access'
  ]) as name
),
table_check as (
  select
    e.name as item,
    'tabela' as tipo,
    case when t.table_name is not null then 'OK' else 'FALTA' end as status
  from expected_tables e
  left join information_schema.tables t
    on t.table_schema = 'public' and t.table_name = e.name
),
expected_columns as (
  select * from (values
    ('clients', 'auth_user_id'),
    ('clients', 'logo_url'),
    ('clients', 'portal_background_url'),
    ('clients', 'legal_name'),
    ('clients', 'cnpj'),
    ('projects', 'briefing_notes'),
    ('projects', 'payment_status'),
    ('projects', 'service_line')
  ) as v(table_name, column_name)
),
column_check as (
  select
    c.table_name || '.' || c.column_name as item,
    'coluna' as tipo,
    case when col.column_name is not null then 'OK' else 'FALTA' end as status
  from expected_columns c
  left join information_schema.columns col
    on col.table_schema = 'public'
    and col.table_name = c.table_name
    and col.column_name = c.column_name
),
expected_functions as (
  select unnest(array[
    'is_hub_admin', 'my_client_id', 'set_updated_at', 'recalculate_project_schedule'
  ]) as name
),
function_check as (
  select
    e.name as item,
    'função' as tipo,
    case when exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = e.name
    ) then 'OK' else 'FALTA' end as status
  from expected_functions e
),
professionals_count as (
  select
    'studio_professionals (11 papéis)' as item,
    'seed' as tipo,
    case
      when not exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'studio_professionals'
      ) then 'FALTA (tabela)'
      when (select count(*) from public.studio_professionals) >= 11 then 'OK'
      else 'FALTA (' || (select count(*)::text from public.studio_professionals) || ')'
    end as status
),
storage_check as (
  select
    'storage bucket client-assets' as item,
    'storage' as tipo,
    case when exists (select 1 from storage.buckets where id = 'client-assets') then 'OK' else 'FALTA' end as status
),
summary as (
  select * from table_check
  union all select * from column_check
  union all select * from function_check
  union all select * from professionals_count
  union all select * from storage_check
),
stats as (
  select
    count(*) filter (where status = 'OK') as ok_count,
    count(*) filter (where status like 'FALTA%') as missing_count
  from summary
)
select item, tipo, status
from (
  select 0 as sort_group, 0 as sort_item, item, tipo, status from summary
  union all
  select
    1,
    0,
    '════════ RESUMO ════════',
    'total OK: ' || (select ok_count::text from stats),
    case
      when (select missing_count from stats) = 0
      then '✓ Todas as migrations aplicadas'
      else '✗ Faltam ' || (select missing_count::text from stats) || ' item(ns) — veja FALTA acima'
    end
) ordered
order by sort_group, sort_item,
  case when sort_group = 0 and status like 'FALTA%' then 0 else 1 end,
  tipo, item;
