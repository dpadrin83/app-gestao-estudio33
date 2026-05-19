-- Imagem de fundo personalizada no portal do cliente
alter table public.clients
  add column if not exists portal_background_url text;

comment on column public.clients.portal_background_url is
  'URL pública de imagem de fundo do portal (ex.: Storage). Sobreposição escura mantém leitura do texto.';
