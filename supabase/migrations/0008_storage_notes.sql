-- Supabase Storage is used for facility photos.
--
-- This migration creates a private bucket and object policies when the
-- Supabase Storage schema is available to the migration runner. If your
-- environment does not allow Storage changes through SQL migrations, create
-- the bucket manually in the Supabase Dashboard:
--
--   Bucket name: facility-photos
--   Public bucket: No
--   File size limit: 10 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   Suggested path: facilities/{facility_id}/{photo_id}-{filename}

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'facility-photos',
  'facility-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Active users can read facility photo objects" on storage.objects;
create policy "Active users can read facility photo objects"
on storage.objects
for select
using (
  bucket_id = 'facility-photos'
  and public.is_active_user()
);

drop policy if exists "Admins can upload facility photo objects" on storage.objects;
create policy "Admins can upload facility photo objects"
on storage.objects
for insert
with check (
  bucket_id = 'facility-photos'
  and public.is_admin()
);

drop policy if exists "Admins can update facility photo objects" on storage.objects;
create policy "Admins can update facility photo objects"
on storage.objects
for update
using (
  bucket_id = 'facility-photos'
  and public.is_admin()
)
with check (
  bucket_id = 'facility-photos'
  and public.is_admin()
);

drop policy if exists "Admins can delete facility photo objects" on storage.objects;
create policy "Admins can delete facility photo objects"
on storage.objects
for delete
using (
  bucket_id = 'facility-photos'
  and public.is_admin()
);
