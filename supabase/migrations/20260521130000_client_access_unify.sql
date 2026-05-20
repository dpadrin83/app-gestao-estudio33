-- Unifica domínios/hospedagem em client_access (login + senha + renovação)

alter table public.client_access
  add column if not exists provider text,
  add column if not exists amount numeric(12, 2),
  add column if not exists billing_cycle text default 'yearly',
  add column if not exists currency text not null default 'BRL';

alter table public.client_access drop constraint if exists client_access_kind_check;
alter table public.client_access add constraint client_access_kind_check
  check (kind in (
    'instagram', 'registro_br',
    'domain_br', 'domain', 'hosting', 'email', 'ssl', 'cdn',
    'other'
  ));

alter table public.client_access drop constraint if exists client_access_billing_cycle_check;
alter table public.client_access add constraint client_access_billing_cycle_check
  check (billing_cycle is null or billing_cycle in ('monthly', 'yearly', 'other'));

-- Migrar registros antigos de client_services (se existirem)
insert into public.client_access (
  client_id, kind, label, provider, next_due_date, billing_cycle, amount, currency,
  login_url, username, password, notes, is_active, created_at, updated_at
)
select
  s.client_id,
  s.kind,
  s.name,
  s.provider,
  s.next_due_date,
  s.billing_cycle,
  s.amount,
  s.currency,
  s.panel_url,
  coalesce(nullif(trim(s.provider), ''), s.name),
  'a definir',
  s.notes,
  s.is_active,
  s.created_at,
  s.updated_at
from public.client_services s
where not exists (
  select 1 from public.client_access a
  where a.client_id = s.client_id
    and a.kind = s.kind
    and a.label = s.name
    and a.next_due_date is not distinct from s.next_due_date
);

comment on table public.client_access is
  'Acessos do cliente: redes, Registro.br, domínios, hospedagem — login, senha, vencimento e valor.';
