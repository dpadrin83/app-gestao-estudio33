-- Vencimento e senha nos acessos do cliente
alter table public.client_access
  add column if not exists next_due_date date,
  add column if not exists password text;

create index if not exists client_access_due_idx
  on public.client_access (next_due_date)
  where is_active = true and next_due_date is not null;
