-- Logo da organização no portal do cliente
alter table public.clients
  add column if not exists logo_url text;

comment on column public.clients.logo_url is
  'URL pública do logo (ex.: Storage). Exibido no portal do cliente.';
