-- ====================================================================
-- Hub Estúdio 33 — Cadastro completo de cliente (empresa + contato)
-- ====================================================================

alter table public.clients
  add column if not exists legal_name text,
  add column if not exists cnpj text,
  add column if not exists segment text,
  add column if not exists company_size text,
  add column if not exists website text,
  add column if not exists contact_name text,
  add column if not exists contact_role text,
  add column if not exists whatsapp text;

create index if not exists clients_cnpj_idx on public.clients (cnpj) where cnpj is not null;
create index if not exists clients_contact_name_idx on public.clients (contact_name);

alter table public.clients drop constraint if exists clients_status_check;

alter table public.clients
  add constraint clients_status_check
  check (status in ('prospect', 'active', 'paused', 'closed', 'inactive'));

comment on column public.clients.name is 'Nome fantasia ou nome principal da empresa';
comment on column public.clients.legal_name is 'Razão social (opcional)';
comment on column public.clients.status is 'prospect | active | paused | closed | inactive (arquivado)';
