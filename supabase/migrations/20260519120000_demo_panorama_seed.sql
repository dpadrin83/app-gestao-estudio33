-- ====================================================================
-- Hub Estúdio 33 — Dados demo (panorama do sistema)
-- Prefixo [DEMO] em clientes e projetos. Reexecutar: apaga e recria.
-- ====================================================================

-- ─── limpar demo anterior ───────────────────────────────────────────
delete from public.projects where name like '[DEMO]%';
delete from public.clients where name like '[DEMO]%';

-- ─── clientes (todos os campos) ─────────────────────────────────────
insert into public.clients (
  id, name, legal_name, cnpj, segment, company_size, website,
  contact_name, contact_role, email, phone, whatsapp, notes, status
) values
  (
    '11111111-1111-4111-8111-111111110001',
    '[DEMO] Verde Foods',
    'Verde Foods Indústria Ltda',
    '12.345.678/0001-90',
    'Alimentos',
    'medium',
    'https://verdefoods.demo',
    'Marina Costa',
    'Marketing',
    'marina@verdefoods.demo',
    '+55 11 3000-1001',
    '+55 11 99001-1001',
    'Cliente ativo. Interesse em reposicionamento de marca.',
    'active'
  ),
  (
    '11111111-1111-4111-8111-111111110002',
    '[DEMO] Luna Moda',
    'Luna Moda Comércio S.A.',
    '23.456.789/0001-01',
    'Moda',
    'small',
    'https://lunamoda.demo',
    'Felipe Araujo',
    'Diretor criativo',
    'felipe@lunamoda.demo',
    '+55 21 3000-2002',
    '+55 21 99002-2002',
    'Identidade visual em andamento — referências Pinterest no Drive.',
    'active'
  ),
  (
    '11111111-1111-4111-8111-111111110003',
    '[DEMO] Podcast Horizonte',
    'Horizonte Mídia Ltda',
    '34.567.890/0001-12',
    'Mídia / Podcast',
    'micro',
    'https://horizonte.demo',
    'Camila Rocha',
    'Produtora',
    'camila@horizonte.demo',
    '+55 31 3000-3003',
    '+55 31 99003-3003',
    'Pacote mensal de conteúdo para Instagram e YouTube.',
    'active'
  ),
  (
    '11111111-1111-4111-8111-111111110004',
    '[DEMO] TechStart',
    'TechStart Inovação Ltda',
    '45.678.901/0001-23',
    'SaaS B2B',
    'small',
    'https://techstart.demo',
    'Ricardo Mendes',
    'CEO',
    'ricardo@techstart.demo',
    '+55 11 3000-4004',
    '+55 11 99004-4004',
    'Landing de lançamento do produto v2.',
    'active'
  ),
  (
    '11111111-1111-4111-8111-111111110005',
    '[DEMO] FinBank',
    'FinBank Digital S.A.',
    '56.789.012/0001-34',
    'Fintech',
    'large',
    'https://finbank.demo',
    'Ana Paula Nunes',
    'CTO',
    'ana@finbank.demo',
    '+55 11 3000-5005',
    '+55 11 99005-5005',
    'Portal do cliente + área logada. Homologação em maio.',
    'active'
  ),
  (
    '11111111-1111-4111-8111-111111110006',
    '[DEMO] Grupo Atlas',
    'Atlas Holding Participações',
    '67.890.123/0001-45',
    'Holding',
    'large',
    'https://grupoatlas.demo',
    'Eduardo Lima',
    'VP Marketing',
    'eduardo@grupoatlas.demo',
    '+55 11 3000-6006',
    '+55 11 99006-6006',
    'Projeto híbrido pausado aguardando aprovação de budget.',
    'paused'
  ),
  (
    '11111111-1111-4111-8111-111111110007',
    '[DEMO] Café Orfeu',
    'Café Orfeu Torrefação Ltda',
    '78.901.234/0001-56',
    'Food & Beverage',
    'small',
    'https://cafeorfeu.demo',
    'João Orfeu',
    'Sócio',
    'joao@cafeorfeu.demo',
    '+55 19 3000-7007',
    null,
    'Projeto concluído — referência para novos prospects.',
    'closed'
  ),
  (
    '11111111-1111-4111-8111-111111110008',
    '[DEMO] Prospect Vitrine',
    null,
    null,
    'Varejo',
    'micro',
    null,
    'Lucas Vitrine',
    'Dono',
    'lucas@vitrine.demo',
    null,
    '+55 11 99008-0008',
    'Prospecto — reunião de diagnóstico agendada.',
    'prospect'
  );

-- ─── projetos (uma área E33 cada + híbrido + concluído) ────────────
insert into public.projects (
  id, client_id, name, description, briefing_notes, status,
  start_date, expected_end_date, contract_value, payment_status, service_line
) values
  (
    '22222222-2222-4222-8222-222222220001',
    '11111111-1111-4111-8111-111111110001',
    '[DEMO] Branding estratégico — Verde Foods',
    'Reposicionamento de marca para linha premium de snacks naturais.',
    E'Briefing:\n- Público: famílias classe A/B, 28–45 anos\n- Tom: autêntico, sustentável, sem greenwashing\n- Entregável: brand book estratégico + territórios\n- Prazo: 6 semanas',
    'in_progress',
    '2026-04-01', '2026-05-15', 12000.00, 'invoiced', 'branding'
  ),
  (
    '22222222-2222-4222-8222-222222220002',
    '11111111-1111-4111-8111-111111110002',
    '[DEMO] Identidade visual — Luna Moda',
    'Nova identidade para rebranding da coleção outono/inverno.',
    E'Briefing:\n- Estilo: minimalista, tipografia forte\n- Evitar clichês de fast fashion\n- Aplicações: sacola, etiqueta, redes',
    'in_progress',
    '2026-03-10', '2026-05-30', 18500.00, 'invoiced', 'identity'
  ),
  (
    '22222222-2222-4222-8222-222222220003',
    '11111111-1111-4111-8111-111111110003',
    '[DEMO] Produção de conteúdo — Horizonte',
    'Calendário editorial + peças para redes (abril–maio).',
    E'Briefing:\n- 12 posts feed + 8 reels\n- Tom conversacional, educativo\n- Gravação quinzenal em estúdio parceiro',
    'in_progress',
    '2026-04-15', '2026-06-15', 9800.00, 'to_invoice', 'content'
  ),
  (
    '22222222-2222-4222-8222-222222220004',
    '11111111-1111-4111-8111-111111110004',
    '[DEMO] Landing page — TechStart v2',
    'Landing de conversão para trial do SaaS.',
    E'Briefing:\n- CTA principal: iniciar trial 14 dias\n- Integração formulário HubSpot\n- Mobile first',
    'in_progress',
    '2026-04-01', '2026-05-20', 14000.00, 'to_invoice', 'web_design'
  ),
  (
    '22222222-2222-4222-8222-222222220005',
    '11111111-1111-4111-8111-111111110005',
    '[DEMO] Sistema web — FinBank portal',
    'Área logada do cliente + dashboard de investimentos (MVP).',
    E'Briefing:\n- Stack: Next.js + Supabase (espelho Hub)\n- LGPD e autenticação 2FA na v2\n- Sprints de 2 semanas',
    'in_progress',
    '2026-02-01', '2026-07-01', 45000.00, 'received', 'web_dev'
  ),
  (
    '22222222-2222-4222-8222-222222220006',
    '11111111-1111-4111-8111-111111110006',
    '[DEMO] Marca + site — Grupo Atlas',
    'Pacote híbrido: branding leve + site institucional.',
    E'Briefing:\n- 3 unidades de negócio na mesma holding\n- Site one-page por unidade\n- Pausado até Q3',
    'paused',
    '2026-05-01', '2026-09-01', 32000.00, 'to_invoice', 'hybrid'
  ),
  (
    '22222222-2222-4222-8222-222222220007',
    '11111111-1111-4111-8111-111111110007',
    '[DEMO] Site institucional — Café Orfeu',
    'Site WordPress headless + identidade aplicada (entregue).',
    'Briefing arquivado. Cliente satisfeito — case de portfólio.',
    'done',
    '2025-11-01', '2026-02-28', 11000.00, 'received', 'web_design'
  );

-- ─── atividades (cronograma por projeto) ───────────────────────────
-- Branding
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, status, visible_to_client, sort_order
) values
  ('a2222222-0001-4001-8001-000000000001', '22222222-2222-4222-8222-222222220001', 'planning', 'activity', 'Diagnóstico e briefing', 3, '2026-04-01', '2026-04-03', 'completed', true, 0),
  ('a2222222-0001-4001-8001-000000000002', '22222222-2222-4222-8222-222222220001', 'planning', 'activity', 'Pesquisa e territórios', 4, '2026-04-04', '2026-04-07', 'completed', true, 1),
  ('a2222222-0001-4001-8001-000000000003', '22222222-2222-4222-8222-222222220001', 'production', 'activity', 'Território e naming', 5, '2026-04-08', '2026-04-12', 'in_progress', true, 2),
  ('a2222222-0001-4001-8001-000000000004', '22222222-2222-4222-8222-222222220001', 'review', 'activity', 'Validação estratégica', 3, '2026-04-13', '2026-04-15', 'not_started', true, 3),
  ('a2222222-0001-4001-8001-000000000005', '22222222-2222-4222-8222-222222220001', 'delivery', 'milestone', 'Brand book estratégico', 0, '2026-05-15', '2026-05-15', 'not_started', true, 4);

-- Identidade
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, status, visible_to_client, sort_order
) values
  ('a2222222-0002-4002-8002-000000000001', '22222222-2222-4222-8222-222222220002', 'planning', 'activity', 'Briefing e pesquisa', 3, '2026-03-10', '2026-03-12', 'completed', true, 0),
  ('a2222222-0002-4002-8002-000000000002', '22222222-2222-4222-8222-222222220002', 'production', 'activity', 'Conceito criativo', 5, '2026-03-13', '2026-03-17', 'completed', true, 1),
  ('a2222222-0002-4002-8002-000000000003', '22222222-2222-4222-8222-222222220002', 'review', 'activity', 'Refinamento e sistema', 4, '2026-03-18', '2026-03-21', 'in_progress', true, 2),
  ('a2222222-0002-4002-8002-000000000004', '22222222-2222-4222-8222-222222220002', 'delivery', 'milestone', 'Entrega final', 0, '2026-05-30', '2026-05-30', 'not_started', true, 3);

-- Conteúdo
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, status, visible_to_client, sort_order
) values
  ('a2222222-0003-4003-8003-000000000001', '22222222-2222-4222-8222-222222220003', 'planning', 'activity', 'Pauta e calendário editorial', 3, '2026-04-15', '2026-04-17', 'completed', true, 0),
  ('a2222222-0003-4003-8003-000000000002', '22222222-2222-4222-8222-222222220003', 'production', 'activity', 'Roteiros e referências', 4, '2026-04-18', '2026-04-21', 'in_progress', true, 1),
  ('a2222222-0003-4003-8003-000000000003', '22222222-2222-4222-8222-222222220003', 'production', 'activity', 'Produção de peças', 7, '2026-04-22', '2026-04-28', 'not_started', true, 2),
  ('a2222222-0003-4003-8003-000000000004', '22222222-2222-4222-8222-222222220003', 'review', 'activity', 'Revisão interna', 2, '2026-04-29', '2026-04-30', 'not_started', true, 3),
  ('a2222222-0003-4003-8003-000000000005', '22222222-2222-4222-8222-222222220003', 'delivery', 'milestone', 'Pacote final', 0, '2026-06-15', '2026-06-15', 'not_started', true, 4);

-- Landing
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, status, visible_to_client, sort_order
) values
  ('a2222222-0004-4004-8004-000000000001', '22222222-2222-4222-8222-222222220004', 'planning', 'activity', 'Wireframe', 3, '2026-04-01', '2026-04-03', 'completed', true, 0),
  ('a2222222-0004-4004-8004-000000000002', '22222222-2222-4222-8222-222222220004', 'production', 'activity', 'Design UI', 5, '2026-04-04', '2026-04-08', 'in_progress', true, 1),
  ('a2222222-0004-4004-8004-000000000003', '22222222-2222-4222-8222-222222220004', 'production', 'activity', 'Desenvolvimento', 7, '2026-04-09', '2026-04-15', 'not_started', true, 2),
  ('a2222222-0004-4004-8004-000000000004', '22222222-2222-4222-8222-222222220004', 'review', 'activity', 'QA e ajustes', 3, '2026-04-16', '2026-04-18', 'not_started', true, 3),
  ('a2222222-0004-4004-8004-000000000005', '22222222-2222-4222-8222-222222220004', 'delivery', 'milestone', 'Deploy', 0, '2026-05-20', '2026-05-20', 'not_started', true, 4);

-- Sistema web
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, status, visible_to_client, sort_order
) values
  ('a2222222-0005-4005-8005-000000000001', '22222222-2222-4222-8222-222222220005', 'planning', 'activity', 'Discovery', 4, '2026-02-01', '2026-02-04', 'completed', true, 0),
  ('a2222222-0005-4005-8005-000000000002', '22222222-2222-4222-8222-222222220005', 'planning', 'activity', 'Arquitetura e setup', 3, '2026-02-05', '2026-02-07', 'completed', true, 1),
  ('a2222222-0005-4005-8005-000000000003', '22222222-2222-4222-8222-222222220005', 'production', 'activity', 'Sprint 1 — núcleo', 10, '2026-02-08', '2026-02-17', 'completed', true, 2),
  ('a2222222-0005-4005-8005-000000000004', '22222222-2222-4222-8222-222222220005', 'production', 'activity', 'Sprint 2 — features', 10, '2026-02-18', '2026-02-27', 'in_progress', true, 3),
  ('a2222222-0005-4005-8005-000000000005', '22222222-2222-4222-8222-222222220005', 'review', 'activity', 'QA e homologação', 4, '2026-02-28', '2026-03-03', 'not_started', true, 4),
  ('a2222222-0005-4005-8005-000000000006', '22222222-2222-4222-8222-222222220005', 'delivery', 'milestone', 'Deploy produção', 0, '2026-07-01', '2026-07-01', 'not_started', true, 5);

-- Híbrido (pausado)
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, status, visible_to_client, sort_order
) values
  ('a2222222-0006-4006-8006-000000000001', '22222222-2222-4222-8222-222222220006', 'planning', 'activity', 'Workshop marca', 2, '2026-05-01', '2026-05-02', 'completed', true, 0),
  ('a2222222-0006-4006-8006-000000000002', '22222222-2222-4222-8222-222222220006', 'production', 'activity', 'Conceito visual', 5, '2026-05-03', '2026-05-07', 'not_started', true, 1),
  ('a2222222-0006-4006-8006-000000000003', '22222222-2222-4222-8222-222222220006', 'production', 'activity', 'Site institucional', 10, '2026-05-08', '2026-05-17', 'not_started', true, 2);

-- Concluído
insert into public.activities (
  id, project_id, phase, kind, name, estimated_duration_days,
  planned_start_date, planned_end_date, actual_start_date, actual_end_date,
  status, visible_to_client, sort_order
) values
  ('a2222222-0007-4007-8007-000000000001', '22222222-2222-4222-8222-222222220007', 'planning', 'activity', 'Wireframe', 3, '2025-11-01', '2025-11-03', '2025-11-01', '2025-11-03', 'completed', true, 0),
  ('a2222222-0007-4007-8007-000000000002', '22222222-2222-4222-8222-222222220007', 'production', 'activity', 'Design UI', 5, '2025-11-04', '2025-11-08', '2025-11-04', '2025-11-08', 'completed', true, 1),
  ('a2222222-0007-4007-8007-000000000003', '22222222-2222-4222-8222-222222220007', 'production', 'activity', 'Desenvolvimento', 7, '2025-11-09', '2025-11-15', '2025-11-09', '2025-11-15', 'completed', true, 2),
  ('a2222222-0007-4007-8007-000000000004', '22222222-2222-4222-8222-222222220007', 'delivery', 'milestone', 'Deploy', 0, '2026-02-28', '2026-02-28', '2026-02-28', '2026-02-28', 'completed', true, 3);

-- dependências FS (amostra nos projetos principais)
insert into public.activity_dependencies (activity_id, predecessor_id, dependency_type, lag_days)
select v.succ, v.pred, 'FS', 0 from (values
  ('a2222222-0001-4001-8001-000000000002'::uuid, 'a2222222-0001-4001-8001-000000000001'::uuid),
  ('a2222222-0001-4001-8001-000000000003', 'a2222222-0001-4001-8001-000000000002'),
  ('a2222222-0002-4002-8002-000000000002', 'a2222222-0002-4002-8002-000000000001'),
  ('a2222222-0002-4002-8002-000000000003', 'a2222222-0002-4002-8002-000000000002'),
  ('a2222222-0004-4004-8004-000000000002', 'a2222222-0004-4004-8004-000000000001'),
  ('a2222222-0004-4004-8004-000000000003', 'a2222222-0004-4004-8004-000000000002'),
  ('a2222222-0005-4005-8005-000000000003', 'a2222222-0005-4005-8005-000000000002'),
  ('a2222222-0005-4005-8005-000000000004', 'a2222222-0005-4005-8005-000000000003')
) as v(succ, pred)
on conflict (activity_id, predecessor_id) do nothing;

-- ─── entregáveis + versões (vários status) ─────────────────────────
insert into public.deliverables (id, project_id, activity_id, name, type, status) values
  -- Branding
  ('d2222222-0001-4001-8001-000000000001', '22222222-2222-4222-8222-222222220001', 'a2222222-0001-4001-8001-000000000001', 'Brief consolidado', 'doc', 'approved'),
  ('d2222222-0001-4001-8001-000000000002', '22222222-2222-4222-8222-222222220001', 'a2222222-0001-4001-8001-000000000002', 'Mapa de concorrência', 'doc', 'approved'),
  ('d2222222-0001-4001-8001-000000000003', '22222222-2222-4222-8222-222222220001', 'a2222222-0001-4001-8001-000000000003', 'Territórios de marca v1', 'design', 'sent_to_client'),
  ('d2222222-0001-4001-8001-000000000004', '22222222-2222-4222-8222-222222220001', 'a2222222-0001-4001-8001-000000000003', 'Shortlist de naming', 'doc', 'draft'),
  -- Identidade
  ('d2222222-0002-4002-8002-000000000001', '22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000001', 'Síntese de briefing', 'doc', 'approved'),
  ('d2222222-0002-4002-8002-000000000002', '22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000002', 'Apresentação conceito v1', 'design', 'approved'),
  ('d2222222-0002-4002-8002-000000000003', '22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000003', 'Logo final + variações', 'design', 'sent_to_client'),
  ('d2222222-0002-4002-8002-000000000004', '22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000003', 'Paleta e tipografia', 'design', 'rejected'),
  ('d2222222-0002-4002-8002-000000000005', '22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000004', 'Manual da marca (PDF)', 'doc', 'draft'),
  -- Conteúdo
  ('d2222222-0003-4003-8003-000000000001', '22222222-2222-4222-8222-222222220003', 'a2222222-0003-4003-8003-000000000001', 'Plano de conteúdo mensal', 'doc', 'approved'),
  ('d2222222-0003-4003-8003-000000000002', '22222222-2222-4222-8222-222222220003', 'a2222222-0003-4003-8003-000000000002', 'Roteiros aprovados', 'doc', 'internal_review'),
  ('d2222222-0003-4003-8003-000000000003', '22222222-2222-4222-8222-222222220003', 'a2222222-0003-4003-8003-000000000003', 'Reels — lote 1', 'video', 'draft'),
  -- Landing
  ('d2222222-0004-4004-8004-000000000001', '22222222-2222-4222-8222-222222220004', 'a2222222-0004-4004-8004-000000000001', 'Mapa de páginas', 'doc', 'approved'),
  ('d2222222-0004-4004-8004-000000000002', '22222222-2222-4222-8222-222222220004', 'a2222222-0004-4004-8004-000000000002', 'Layout UI (Figma)', 'design', 'sent_to_client'),
  ('d2222222-0004-4004-8004-000000000003', '22222222-2222-4222-8222-222222220004', 'a2222222-0004-4004-8004-000000000003', 'Build homologação', 'code', 'draft'),
  -- DEV
  ('d2222222-0005-4005-8005-000000000001', '22222222-2222-4222-8222-222222220005', 'a2222222-0005-4005-8005-000000000001', 'Documento de discovery', 'doc', 'approved'),
  ('d2222222-0005-4005-8005-000000000002', '22222222-2222-4222-8222-222222220005', 'a2222222-0005-4005-8005-000000000002', 'Repositório e README', 'code', 'approved'),
  ('d2222222-0005-4005-8005-000000000003', '22222222-2222-4222-8222-222222220005', 'a2222222-0005-4005-8005-000000000003', 'Build sprint 1', 'code', 'approved'),
  ('d2222222-0005-4005-8005-000000000004', '22222222-2222-4222-8222-222222220005', 'a2222222-0005-4005-8005-000000000004', 'Build sprint 2', 'code', 'sent_to_client'),
  -- Híbrido
  ('d2222222-0006-4006-8006-000000000001', '22222222-2222-4222-8222-222222220006', 'a2222222-0006-4006-8006-000000000001', 'Ata do workshop', 'doc', 'approved'),
  -- Concluído
  ('d2222222-0007-4007-8007-000000000001', '22222222-2222-4222-8222-222222220007', 'a2222222-0007-4007-8007-000000000002', 'Site em produção', 'link', 'approved');

insert into public.deliverable_versions (deliverable_id, version_number, external_link, notes) values
  ('d2222222-0001-4001-8001-000000000001', 1, 'https://drive.google.com/demo/verde-brief', 'Aprovado na call 02/04'),
  ('d2222222-0001-4001-8001-000000000003', 1, 'https://figma.com/demo/verde-territorios', 'Aguardando feedback'),
  ('d2222222-0002-4002-8002-000000000003', 1, 'https://figma.com/demo/luna-logo', 'Enviado ao cliente'),
  ('d2222222-0002-4002-8002-000000000003', 2, 'https://figma.com/demo/luna-logo-v2', 'Ajuste fino serif'),
  ('d2222222-0002-4002-8002-000000000004', 1, 'https://figma.com/demo/luna-paleta', 'Cliente pediu mais contraste'),
  ('d2222222-0004-4004-8004-000000000002', 1, 'https://figma.com/demo/techstart-ui', 'Desktop + mobile'),
  ('d2222222-0005-4005-8005-000000000004', 1, 'https://github.com/demo/finbank/tree/sprint-2', 'Homologação'),
  ('d2222222-0007-4007-8007-000000000001', 1, 'https://cafeorfeu.demo', 'Produção');

insert into public.deliverable_comments (deliverable_id, author_role, body) values
  ('d2222222-0002-4002-8002-000000000004', 'client', 'A paleta está muito clara no mobile. Podemos escurecer o cinza?'),
  ('d2222222-0002-4002-8002-000000000003', 'client', 'Aprovado o logo principal. Variação monocromática ok.');

-- ─── tarefas Kanban ─────────────────────────────────────────────────
insert into public.tasks (project_id, activity_id, title, description, status, sort_order) values
  ('22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000003', 'Exportar logos em SVG', null, 'doing', 0),
  ('22222222-2222-4222-8222-222222220002', 'a2222222-0002-4002-8002-000000000003', 'Atualizar paleta após feedback', 'Ver comentário do cliente', 'todo', 1),
  ('22222222-2222-4222-8222-222222220002', null, 'Comprar domínio lunamoda.com.br', null, 'done', 2),
  ('22222222-2222-4222-8222-222222220004', 'a2222222-0004-4004-8004-000000000002', 'Revisar hero mobile', null, 'doing', 0),
  ('22222222-2222-4222-8222-222222220004', 'a2222222-0004-4004-8004-000000000003', 'Integrar formulário HubSpot', null, 'todo', 1),
  ('22222222-2222-4222-8222-222222220005', 'a2222222-0005-4005-8005-000000000004', 'Corrigir bug filtro de data', 'Issue #42', 'doing', 0),
  ('22222222-2222-4222-8222-222222220003', 'a2222222-0003-4003-8003-000000000002', 'Gravar episódio 12', null, 'todo', 0);

-- ─── custos + horas ─────────────────────────────────────────────────
insert into public.project_costs (project_id, description, amount, incurred_at) values
  ('22222222-2222-4222-8222-222222220002', 'Banco de imagens Shutterstock', 89.90, '2026-03-15'),
  ('22222222-2222-4222-8222-222222220002', 'Freelancer ilustrador ícones', 450.00, '2026-03-20'),
  ('22222222-2222-4222-8222-222222220004', 'Domínio + hospedagem staging', 120.00, '2026-04-05'),
  ('22222222-2222-4222-8222-222222220005', 'Licença componente charts', 199.00, '2026-02-10');

insert into public.time_sessions (project_id, started_at, ended_at, description) values
  ('22222222-2222-4222-8222-222222220002', '2026-05-12 09:00:00+00', '2026-05-12 12:30:00+00', 'Refinamento logo'),
  ('22222222-2222-4222-8222-222222220002', '2026-05-13 14:00:00+00', '2026-05-13 17:00:00+00', 'Manual da marca — estrutura'),
  ('22222222-2222-4222-8222-222222220004', '2026-05-14 10:00:00+00', '2026-05-14 13:00:00+00', 'UI hero e pricing'),
  ('22222222-2222-4222-8222-222222220005', '2026-05-15 08:30:00+00', '2026-05-15 11:00:00+00', 'Sprint 2 — dashboard'),
  ('22222222-2222-4222-8222-222222220001', '2026-05-10 13:00:00+00', '2026-05-10 16:00:00+00', 'Territórios de marca');

-- ─── links do projeto ───────────────────────────────────────────────
insert into public.project_links (project_id, name, url, kind) values
  ('22222222-2222-4222-8222-222222220002', 'Figma — Luna ID', 'https://figma.com/demo/luna', 'figma'),
  ('22222222-2222-4222-8222-222222220002', 'Drive — Assets', 'https://drive.google.com/demo/luna', 'drive'),
  ('22222222-2222-4222-8222-222222220004', 'Figma — TechStart', 'https://figma.com/demo/techstart', 'figma'),
  ('22222222-2222-4222-8222-222222220004', 'GitHub — Landing', 'https://github.com/demo/techstart-landing', 'github'),
  ('22222222-2222-4222-8222-222222220005', 'GitHub — FinBank', 'https://github.com/demo/finbank', 'github'),
  ('22222222-2222-4222-8222-222222220005', 'Homologação', 'https://staging.finbank.demo', 'link'),
  ('22222222-2222-4222-8222-222222220001', 'Miro — Territórios', 'https://miro.com/demo/verde', 'link');

-- ─── amostra IA (histórico) ─────────────────────────────────────────
insert into public.ai_generations (project_id, kind, content, metadata) values
  (
    '22222222-2222-4222-8222-222222220002',
    'weekly_summary',
    E'• Conceito v1 aprovado\n• Logo em refinamento — cliente pediu ajuste na paleta\n• Manual previsto para semana que vem',
  '{"model":"demo"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222220005',
    'smart_insights',
    'Sprint 2 com 3 atividades atrasadas em relação ao plano. Sugestão: reduzir escopo do filtro avançado para v1.',
    '{"source":"demo_seed"}'::jsonb
  );

comment on table public.clients is 'Dados [DEMO] inseridos por 20260519120000_demo_panorama_seed.sql';
