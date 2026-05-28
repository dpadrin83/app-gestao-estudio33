-- ====================================================================
-- Hub Estúdio 33 — adiciona "consulting" às linhas de serviço (projects)
-- Permite marcar um projeto como Consultoria (guarda-chuva recorrente).
-- O comportamento recorrente/macro ainda é feature a planejar — aqui só
-- liberamos o valor no banco para a opção aparecer no formulário.
-- ====================================================================

-- Remove a trava antiga (CHECK) da coluna service_line, qualquer que seja o nome.
do $$
declare
  c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.projects'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%service_line%';
  if c is not null then
    execute format('alter table public.projects drop constraint %I', c);
  end if;
end $$;

-- Recria a trava já incluindo 'consulting'.
alter table public.projects
  add constraint projects_service_line_check
  check (service_line is null or service_line in (
    'branding', 'identity', 'content', 'web_design', 'web_dev', 'hybrid', 'consulting'
  ));

comment on column public.projects.service_line is
  'branding | identity | content | web_design | web_dev | hybrid | consulting';
