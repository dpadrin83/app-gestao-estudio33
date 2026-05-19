-- Bucket público para logo e fundo do portal (upload pelo admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-assets',
  'client-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read client assets" on storage.objects;
create policy "public read client assets"
  on storage.objects for select
  using (bucket_id = 'client-assets');

drop policy if exists "admin insert client assets" on storage.objects;
create policy "admin insert client assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'client-assets'
    and public.is_hub_admin()
  );

drop policy if exists "admin update client assets" on storage.objects;
create policy "admin update client assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'client-assets' and public.is_hub_admin())
  with check (bucket_id = 'client-assets' and public.is_hub_admin());

drop policy if exists "admin delete client assets" on storage.objects;
create policy "admin delete client assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'client-assets' and public.is_hub_admin());
