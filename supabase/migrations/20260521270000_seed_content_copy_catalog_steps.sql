-- Área: Conteúdo, Copy e Roteiro (roteirista / redator / copywriter E33)
-- Interno até pacote final; cliente aprova uma vez o conteúdo do ciclo.

do $$
declare
  gid uuid;
  copy_id uuid;
  presenca_id uuid;
  pm_id uuid;
  prev_id uuid := null;
  new_id uuid;
  r record;
begin
  select id into copy_id from public.studio_professionals where slug = 'copywriter' limit 1;
  select id into presenca_id from public.studio_professionals where slug = 'designer-presenca-digital' limit 1;
  select id into pm_id from public.studio_professionals where slug = 'pm-orquestrador' limit 1;

  insert into public.deliverable_catalog_groups (name, description, sort_order)
  select
    'Conteúdo, Copy e Roteiro',
    'Estratégia editorial, roteiros e textos. Interno até pacote final; cliente aprova o ciclo de conteúdo.',
    25
  where not exists (
    select 1 from public.deliverable_catalog_groups g
    where lower(trim(g.name)) = lower(trim('Conteúdo, Copy e Roteiro'))
  );

  select id into gid
  from public.deliverable_catalog_groups
  where lower(trim(name)) = lower(trim('Conteúdo, Copy e Roteiro'))
  limit 1;

  if gid is null then
    raise exception 'Conteúdo, Copy e Roteiro: área não encontrada.';
  end if;

  delete from public.studio_deliverable_catalog where group_id = gid;

  for r in
    select *
    from (values
      -- Bloco 1 — Fundação editorial [INTERNO]
      (0,  'Briefing de conteúdo',                         1, 'copywriter',               'doc',
        '[INTERNO] Alinhar com manual verbal, tom, objetivo do ciclo e canais.'),
      (1,  'Estratégia de conteúdo (pilares e canais)',    2, 'copywriter',               'doc',
        '[INTERNO] Pilares, temas, frequência, funil. Prompt: Estratégia de conteúdo.'),
      (2,  'Calendário editorial',                         2, 'copywriter',               'doc',
        '[INTERNO] Grade do período (datas, formatos, temas) — não enviar WIP.'),
      (3,  'Matriz de mensagens por formato',              1, 'copywriter',               'doc',
        '[INTERNO] O que cada peça comunica em Reels, feed, stories, e-mail, etc.'),

      -- Bloco 2 — Roteiro (roteirista) [INTERNO]
      (4,  'Roteiros — Reels e Stories',                   3, 'copywriter',               'doc',
        '[INTERNO] Prompt: Roteiro Reels 30s + sequências Stories. Tabela tempo|cena|áudio|legenda.'),
      (5,  'Roteiro — vídeo longo ou série',               2, 'copywriter',               'doc',
        '[INTERNO] YouTube, institucional ou série episódica.'),
      (6,  'Roteiro — comercial e anúncio',              1, 'copywriter',               'doc',
        '[INTERNO] Spots, ads, VSL curta — CTA e oferta claros.'),

      -- Bloco 3 — Copy (redator) [INTERNO]
      (7,  'Copy — posts, legendas e CTAs',                3, 'copywriter',               'doc',
        '[INTERNO] Pacote do ciclo: feed, legendas, hashtags estratégicas.'),
      (8,  'Copy — carrosséis e materiais ricos',        2, 'copywriter',               'doc',
        '[INTERNO] Texto slide a slide + notas para design.'),
      (9,  'Copy — páginas e blocos web',                2, 'copywriter',               'doc',
        '[INTERNO] Headlines, seções, CTAs (quando não for só Soluções Digitais).'),
      (10, 'Copy — e-mail e automações',                 2, 'copywriter',               'doc',
        '[INTERNO] Newsletters, fluxos, assuntos e pré-headers.'),

      -- Bloco 4 — Handoff para arte [INTERNO]
      (11, 'Brief criativo para design das peças',       1, 'copywriter',               'doc',
        '[INTERNO] Referências, formato, mensagem por peça para designer de peças.'),
      (12, 'Direção de arte (social e peças)',         1, 'designer-presenca-digital', 'design',
        '[INTERNO] Mood, composição, regras visuais do pacote — sem enviar rascunho ao cliente.'),
      (13, 'Revisão de copy (tom, marca e clareza)',     1, 'copywriter',               'doc',
        '[INTERNO] Checklist brand compliance antes do pacote final.'),

      -- Bloco 5 — Cliente e entrega
      (14, 'Aprovação do cliente — pacote de conteúdo',   1, 'pm-orquestrador',          'doc',
        '[APROVAÇÃO CLIENTE] Textos + roteiros finalizados do ciclo. Portal ou PDF único.'),
      (15, 'Ajustes pós-aprovação (rodada contratual)',  2, 'copywriter',               'doc',
        '[INTERNO] Só o previsto em contrato; mudança de escopo = aditivo.'),
      (16, 'Entrega final (arquivos e handoff)',         1, 'pm-orquestrador',          'doc',
        '[INTERNO] Docs finais para design/publicação; gestor organiza Drive.')
    ) as v(sort_order, name, days, prof_slug, dtype, notes)
  loop
    insert into public.studio_deliverable_catalog (
      group_id, name, deliverable_type, estimated_days,
      professional_id, predecessor_id, service_line, notes, sort_order
    )
    values (
      gid,
      r.name,
      r.dtype,
      r.days,
      case r.prof_slug
        when 'designer-presenca-digital' then presenca_id
        when 'pm-orquestrador' then pm_id
        else copy_id
      end,
      prev_id,
      'content',
      r.notes,
      r.sort_order
    )
    returning id into new_id;

    prev_id := new_id;
  end loop;
end $$;
