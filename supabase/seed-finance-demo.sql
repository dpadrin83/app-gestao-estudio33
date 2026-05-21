-- ====================================================================
-- Popula dados financeiros para visualização macro (Hub E33)
-- Seguro reexecutar: custos/sessões [FIN-DEMO] são substituídos.
-- Requer projetos [DEMO] (rode 20260519120000_demo_panorama_seed.sql antes, se não tiver).
-- ====================================================================

-- Config global (se ainda não existir)
insert into public.app_settings (key, value, updated_at)
values
  ('hourly_rate', '150'::jsonb, now()),
  ('margin_alert_percent', '20'::jsonb, now())
on conflict (key) do update set
  value = excluded.value,
  updated_at = excluded.updated_at;

-- Datas de faturamento / recebimento nos [DEMO]
update public.projects set
  invoiced_at  = case id
    when '22222222-2222-4222-8222-222222220001' then '2026-04-10'::date  -- faturado há 30+ dias
    when '22222222-2222-4222-8222-222222220002' then '2026-03-05'::date
    when '22222222-2222-4222-8222-222222220005' then '2026-02-20'::date
    when '22222222-2222-4222-8222-222222220007' then '2026-01-15'::date
    else invoiced_at
  end,
  received_at = case id
    when '22222222-2222-4222-8222-222222220005' then '2026-05-05'::date  -- recebido no mês
    when '22222222-2222-4222-8222-222222220007' then '2026-02-20'::date
    else received_at
  end,
  payment_status = case id
    when '22222222-2222-4222-8222-222222220001' then 'invoiced'
    when '22222222-2222-4222-8222-222222220002' then 'invoiced'
    when '22222222-2222-4222-8222-222222220003' then 'to_invoice'
    when '22222222-2222-4222-8222-222222220004' then 'to_invoice'
    when '22222222-2222-4222-8222-222222220005' then 'received'
    when '22222222-2222-4222-8222-222222220006' then 'to_invoice'
    when '22222222-2222-4222-8222-222222220007' then 'received'
    else payment_status
  end
where name like '[DEMO]%';

-- Custos demo extras (substitui lote anterior [FIN-DEMO])
delete from public.project_costs
where description like '[FIN-DEMO]%';

insert into public.project_costs (project_id, description, amount, incurred_at) values
  ('22222222-2222-4222-8222-222222220001', '[FIN-DEMO] Pesquisa de mercado', 800.00, '2026-04-02'),
  ('22222222-2222-4222-8222-222222220002', '[FIN-DEMO] Fotógrafo lookbook', 2200.00, '2026-03-18'),
  ('22222222-2222-4222-8222-222222220002', '[FIN-DEMO] Licença fontes premium', 380.00, '2026-04-01'),
  ('22222222-2222-4222-8222-222222220003', '[FIN-DEMO] Locação estúdio', 650.00, '2026-04-20'),
  ('22222222-2222-4222-8222-222222220004', '[FIN-DEMO] Plugin WordPress', 89.00, '2026-04-08'),
  ('22222222-2222-4222-8222-222222220004', '[FIN-DEMO] Copy freelancer', 1200.00, '2026-04-12'),
  ('22222222-2222-4222-8222-222222220005', '[FIN-DEMO] Infra Supabase/Vercel 3m', 450.00, '2026-02-15'),
  ('22222222-2222-4222-8222-222222220005', '[FIN-DEMO] Auditoria segurança', 3500.00, '2026-03-01'),
  ('22222222-2222-4222-8222-222222220006', '[FIN-DEMO] Workshop facilitador', 1500.00, '2026-05-02'),
  ('22222222-2222-4222-8222-222222220007', '[FIN-DEMO] Hospedagem anual', 240.00, '2025-12-01');

-- Sessões demo (substitui lote [FIN-DEMO]) — alimenta mão de obra e margem
delete from public.time_sessions
where description like '[FIN-DEMO]%';

insert into public.time_sessions (project_id, started_at, ended_at, description) values
  -- Luna: muitas horas → margem em risco
  ('22222222-2222-4222-8222-222222220002', '2026-05-01 09:00:00+00', '2026-05-01 18:00:00+00', '[FIN-DEMO] Design sistema'),
  ('22222222-2222-4222-8222-222222220002', '2026-05-05 10:00:00+00', '2026-05-05 17:30:00+00', '[FIN-DEMO] Aplicações marca'),
  ('22222222-2222-4222-8222-222222220002', '2026-05-12 08:00:00+00', '2026-05-12 14:00:00+00', '[FIN-DEMO] Manual PDF'),
  ('22222222-2222-4222-8222-222222220002', '2026-05-15 13:00:00+00', '2026-05-15 19:00:00+00', '[FIN-DEMO] Revisão cliente'),
  -- FinBank: recebido em maio (gráfico dashboard)
  ('22222222-2222-4222-8222-222222220005', '2026-05-08 09:00:00+00', '2026-05-08 12:00:00+00', '[FIN-DEMO] Sprint homolog'),
  ('22222222-2222-4222-8222-222222220005', '2026-04-20 14:00:00+00', '2026-04-20 18:00:00+00', '[FIN-DEMO] API investimentos'),
  -- Café Orfeu: recebido fev (barra histórica)
  ('22222222-2222-4222-8222-222222220007', '2026-01-10 10:00:00+00', '2026-01-10 16:00:00+00', '[FIN-DEMO] Deploy final'),
  -- Verde: poucas horas, margem ok mas faturado em aberto
  ('22222222-2222-4222-8222-222222220001', '2026-05-10 13:00:00+00', '2026-05-10 16:00:00+00', '[FIN-DEMO] Territórios'),
  -- TechStart: margem negativa (muito custo + horas)
  ('22222222-2222-4222-8222-222222220004', '2026-05-14 09:00:00+00', '2026-05-14 17:00:00+00', '[FIN-DEMO] Dev landing'),
  ('22222222-2222-4222-8222-222222220004', '2026-05-16 10:00:00+00', '2026-05-16 15:00:00+00', '[FIN-DEMO] Integração CRM');

-- Projetos reais (não [DEMO]): preenche datas se vazias e tem valor
update public.projects set
  invoiced_at = coalesce(invoiced_at, start_date, current_date - 14),
  received_at = case
    when payment_status = 'received' and received_at is null
      then coalesce(start_date, current_date - 7)
    else received_at
  end
where name not like '[DEMO]%'
  and status in ('in_progress', 'paused', 'done')
  and contract_value is not null
  and contract_value > 0;

-- Resumo esperado após seed:
-- A faturar: Horizonte + TechStart + Atlas ≈ 9.8k + 14k + 32k
-- Faturado: Verde + Luna ≈ 12k + 18.5k
-- Recebido no mês: FinBank 45k (se received_at em maio/2026)
-- Em risco: Luna (horas altas), possivelmente TechStart (custos)

select
  payment_status,
  count(*) as projetos,
  sum(contract_value) as total
from public.projects
where name like '[DEMO]%'
group by payment_status
order by payment_status;
