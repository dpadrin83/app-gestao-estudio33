-- Fase A financeiro: datas de faturamento/recebimento + arquivos (contratos, NF, etc.)

alter table public.projects
  add column if not exists invoiced_at date,
  add column if not exists received_at date;

comment on column public.projects.invoiced_at is 'Data em que a NF foi emitida / faturado ao cliente';
comment on column public.projects.received_at is 'Data em que o pagamento entrou (fluxo de caixa)';

create table if not exists public.project_finance_documents (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  kind          text not null check (kind in ('contract', 'invoice', 'receipt', 'other')),
  title         text not null default '',
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  file_size     bigint,
  created_at    timestamptz not null default now()
);

create index if not exists project_finance_documents_project_id_idx
  on public.project_finance_documents (project_id);

alter table public.project_finance_documents enable row level security;

drop policy if exists "admin manage project finance documents" on public.project_finance_documents;
create policy "admin manage project finance documents"
  on public.project_finance_documents
  for all
  to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

-- Bucket privado (download via URL assinada)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-finance-docs',
  'project-finance-docs',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin read project finance docs" on storage.objects;
create policy "admin read project finance docs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-finance-docs' and public.is_hub_admin());

drop policy if exists "admin insert project finance docs" on storage.objects;
create policy "admin insert project finance docs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-finance-docs' and public.is_hub_admin());

drop policy if exists "admin update project finance docs" on storage.objects;
create policy "admin update project finance docs"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-finance-docs' and public.is_hub_admin())
  with check (bucket_id = 'project-finance-docs' and public.is_hub_admin());

drop policy if exists "admin delete project finance docs" on storage.objects;
create policy "admin delete project finance docs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-finance-docs' and public.is_hub_admin());
