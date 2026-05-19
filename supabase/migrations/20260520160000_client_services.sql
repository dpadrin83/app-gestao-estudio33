-- Domínios, hospedagem e outros serviços recorrentes por cliente
create table if not exists public.client_services (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  kind            text not null default 'other'
                  check (kind in (
                    'domain_br', 'domain', 'hosting', 'email', 'ssl', 'cdn', 'other'
                  )),
  name            text not null,
  provider        text,
  next_due_date   date not null,
  billing_cycle   text not null default 'yearly'
                  check (billing_cycle in ('monthly', 'yearly', 'other')),
  amount          numeric(12, 2),
  currency        text not null default 'BRL',
  panel_url       text,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists client_services_client_idx
  on public.client_services (client_id);

create index if not exists client_services_due_idx
  on public.client_services (next_due_date)
  where is_active = true;

comment on table public.client_services is
  'Domínios (.br etc.), hospedagem, e-mail e renovações com data de vencimento e valor.';

alter table public.client_services enable row level security;

drop policy if exists "admin all on client_services" on public.client_services;
create policy "admin all on client_services" on public.client_services
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());
