-- ====================================================================
-- Hub Estúdio 33 — Fase 8: linha de serviço, plano de entregas, templates
-- ====================================================================

-- ─── projects: área E33 ─────────────────────────────────────────────
alter table public.projects
  add column if not exists service_line text
  check (service_line is null or service_line in (
    'branding', 'identity', 'content', 'web_design', 'web_dev', 'hybrid'
  ));

comment on column public.projects.service_line is
  'branding | identity | content | web_design | web_dev | hybrid';

-- ─── templates: área + entregas padrão ──────────────────────────────
alter table public.schedule_templates
  add column if not exists service_line text
  check (service_line is null or service_line in (
    'branding', 'identity', 'content', 'web_design', 'web_dev', 'hybrid'
  ));

create table if not exists public.schedule_template_deliverables (
  id                   uuid primary key default gen_random_uuid(),
  template_id          uuid not null references public.schedule_templates(id) on delete cascade,
  name                 text not null,
  type                 text not null default 'design'
                       check (type in ('video','design','doc','code','link')),
  activity_sort_order  int not null,
  sort_order           int not null default 0,
  created_at           timestamptz not null default now()
);

create index if not exists schedule_template_deliverables_template_idx
  on public.schedule_template_deliverables (template_id, activity_sort_order, sort_order);

alter table public.schedule_template_deliverables enable row level security;

drop policy if exists "auth read schedule_template_deliverables" on public.schedule_template_deliverables;
create policy "auth read schedule_template_deliverables" on public.schedule_template_deliverables
  for select to authenticated using (true);

drop policy if exists "admin all schedule_template_deliverables" on public.schedule_template_deliverables;
create policy "admin all schedule_template_deliverables" on public.schedule_template_deliverables
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

-- marcar templates existentes
update public.schedule_templates set service_line = 'identity' where name = 'Identidade visual';
update public.schedule_templates set service_line = 'web_design' where name = 'Landing page';
update public.schedule_templates set service_line = 'web_dev' where name = 'Sistema web';

-- ─── novos templates ────────────────────────────────────────────────
insert into public.schedule_templates (name, description, service_line) values
  (
    'Branding / estratégia',
    'Posicionamento, território de marca e documento estratégico.',
    'branding'
  ),
  (
    'Produção de conteúdo',
    'Pauta, produção de peças e pacote final para redes.',
    'content'
  )
on conflict (name) do update set
  description = excluded.description,
  service_line = excluded.service_line;

-- Branding: atividades
insert into public.schedule_template_items
  (template_id, name, phase, kind, estimated_duration_days, sort_order, predecessor_sort_order, lag_days)
select t.id, v.name, v.phase, v.kind, v.days, v.ord, v.pred, 0
from public.schedule_templates t
cross join (values
  ('Diagnóstico e briefing', 'planning', 'activity', 3, 0, null::int),
  ('Pesquisa e territórios', 'planning', 'activity', 4, 1, 0),
  ('Território e naming', 'production', 'activity', 5, 2, 1),
  ('Validação estratégica', 'review', 'activity', 3, 3, 2),
  ('Brand book estratégico', 'delivery', 'milestone', 1, 4, 3)
) as v(name, phase, kind, days, ord, pred)
where t.name = 'Branding / estratégia'
  and not exists (select 1 from public.schedule_template_items i where i.template_id = t.id);

-- Conteúdo: atividades
insert into public.schedule_template_items
  (template_id, name, phase, kind, estimated_duration_days, sort_order, predecessor_sort_order, lag_days)
select t.id, v.name, v.phase, v.kind, v.days, v.ord, v.pred, 0
from public.schedule_templates t
cross join (values
  ('Pauta e calendário editorial', 'planning', 'activity', 3, 0, null::int),
  ('Roteiros e referências', 'production', 'activity', 4, 1, 0),
  ('Produção de peças', 'production', 'activity', 7, 2, 1),
  ('Revisão interna', 'review', 'activity', 2, 3, 2),
  ('Pacote final', 'delivery', 'milestone', 1, 4, 3)
) as v(name, phase, kind, days, ord, pred)
where t.name = 'Produção de conteúdo'
  and not exists (select 1 from public.schedule_template_items i where i.template_id = t.id);

-- ─── entregas padrão por template ───────────────────────────────────
-- helper: só insere se template ainda não tem entregas seed
-- Identidade visual (sort 0..3)
insert into public.schedule_template_deliverables (template_id, name, type, activity_sort_order, sort_order)
select t.id, v.name, v.type, v.act_ord, v.sort_ord
from public.schedule_templates t
cross join (values
  ('Síntese de briefing', 'doc', 0, 0),
  ('Mapa de referências', 'link', 0, 1),
  ('Apresentação conceito v1', 'design', 1, 0),
  ('Apresentação conceito v2', 'design', 2, 0),
  ('Logo final + variações', 'design', 2, 1),
  ('Paleta e tipografia', 'design', 2, 2),
  ('Manual da marca (PDF)', 'doc', 3, 0),
  ('Pacote de arquivos (.ai/.svg)', 'link', 3, 1)
) as v(name, type, act_ord, sort_ord)
where t.name = 'Identidade visual'
  and not exists (
    select 1 from public.schedule_template_deliverables d where d.template_id = t.id
  );

-- Landing page
insert into public.schedule_template_deliverables (template_id, name, type, activity_sort_order, sort_order)
select t.id, v.name, v.type, v.act_ord, v.sort_ord
from public.schedule_templates t
cross join (values
  ('Mapa de páginas', 'doc', 0, 0),
  ('Wireframes', 'design', 0, 1),
  ('Layout UI (Figma)', 'design', 1, 0),
  ('Protótipo navegável', 'link', 1, 1),
  ('Build homologação', 'code', 2, 0),
  ('Site em produção', 'link', 4, 0)
) as v(name, type, act_ord, sort_ord)
where t.name = 'Landing page'
  and not exists (
    select 1 from public.schedule_template_deliverables d where d.template_id = t.id
  );

-- Sistema web
insert into public.schedule_template_deliverables (template_id, name, type, activity_sort_order, sort_order)
select t.id, v.name, v.type, v.act_ord, v.sort_ord
from public.schedule_templates t
cross join (values
  ('Documento de discovery', 'doc', 0, 0),
  ('Arquitetura técnica', 'doc', 1, 0),
  ('Repositório e README', 'code', 1, 1),
  ('Build sprint 1', 'code', 2, 0),
  ('Build sprint 2', 'code', 3, 0),
  ('Relatório de QA', 'doc', 4, 0),
  ('URL produção', 'link', 5, 0)
) as v(name, type, act_ord, sort_ord)
where t.name = 'Sistema web'
  and not exists (
    select 1 from public.schedule_template_deliverables d where d.template_id = t.id
  );

-- Branding
insert into public.schedule_template_deliverables (template_id, name, type, activity_sort_order, sort_order)
select t.id, v.name, v.type, v.act_ord, v.sort_ord
from public.schedule_templates t
cross join (values
  ('Brief consolidado', 'doc', 0, 0),
  ('Mapa de concorrência', 'doc', 1, 0),
  ('Territórios de marca', 'design', 2, 0),
  ('Shortlist de naming', 'doc', 2, 1),
  ('Apresentação estratégica', 'design', 3, 0),
  ('Brand book estratégico', 'doc', 4, 0)
) as v(name, type, act_ord, sort_ord)
where t.name = 'Branding / estratégia'
  and not exists (
    select 1 from public.schedule_template_deliverables d where d.template_id = t.id
  );

-- Conteúdo
insert into public.schedule_template_deliverables (template_id, name, type, activity_sort_order, sort_order)
select t.id, v.name, v.type, v.act_ord, v.sort_ord
from public.schedule_templates t
cross join (values
  ('Plano de conteúdo mensal', 'doc', 0, 0),
  ('Roteiros aprovados', 'doc', 1, 0),
  ('Peças para revisão', 'design', 2, 0),
  ('Vídeos / artes finais', 'video', 3, 0),
  ('Pacote publicação (legendas + specs)', 'doc', 4, 0)
) as v(name, type, act_ord, sort_ord)
where t.name = 'Produção de conteúdo'
  and not exists (
    select 1 from public.schedule_template_deliverables d where d.template_id = t.id
  );
