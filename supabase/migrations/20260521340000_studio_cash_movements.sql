-- Movimentos de caixa do estúdio (sem vínculo obrigatório com projeto)
-- Cartão, operacional, impostos, entradas avulsas, etc.

create table if not exists public.studio_cash_movements (
  id            uuid primary key default gen_random_uuid(),
  movement_type text not null check (movement_type in ('in', 'out')),
  amount        numeric(12, 2) not null check (amount > 0),
  occurred_at   date not null,
  description   text not null,
  category      text not null default 'operational' check (category in (
    'operational',
    'software',
    'tax',
    'marketing',
    'equipment',
    'card',
    'payroll',
    'owner_draw',
    'other'
  )),
  project_id    uuid references public.projects(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists studio_cash_movements_occurred_at_idx
  on public.studio_cash_movements (occurred_at desc);

create index if not exists studio_cash_movements_project_id_idx
  on public.studio_cash_movements (project_id)
  where project_id is not null;

alter table public.studio_cash_movements enable row level security;

drop policy if exists "admin manage studio cash movements" on public.studio_cash_movements;
create policy "admin manage studio cash movements"
  on public.studio_cash_movements
  for all
  to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

comment on table public.studio_cash_movements is
  'Lançamentos de caixa do estúdio — gastos/receitas do dia a dia sem projeto obrigatório';
