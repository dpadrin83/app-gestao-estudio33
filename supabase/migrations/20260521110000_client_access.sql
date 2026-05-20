-- Acessos e logins do cliente (Instagram, Registro.br, outros painéis)
create table if not exists public.client_access (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  kind        text not null default 'other'
              check (kind in ('instagram', 'registro_br', 'other')),
  label       text not null,
  login_url   text,
  username    text,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists client_access_client_idx
  on public.client_access (client_id);

comment on table public.client_access is
  'Acessos do cliente: Instagram, Registro.br e outros — login/URL e notas (sem senha em texto).';

alter table public.client_access enable row level security;

drop policy if exists "admin all on client_access" on public.client_access;
create policy "admin all on client_access" on public.client_access
  for all to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());
