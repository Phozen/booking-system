# Storage Setup

This project uses Supabase Storage for facility photos.

## Facility Photos Bucket

Bucket name:

- `facility-photos`

Expected bucket configuration:

- Public bucket: No
- File size limit in Supabase: 10 MB
- App upload limit: 5 MB
- Allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Migration `supabase/migrations/0008_storage_notes.sql` creates or updates this bucket when the Supabase Storage schema is available to the migration runner. If a Supabase environment does not allow bucket changes through SQL migrations, create or verify the bucket manually in the Supabase Dashboard.

## Storage Paths

Facility photos are stored under:

```text
facilities/{facility_id}/{timestamp}-{uuid}-{safe-file-name}.{ext}
```

The app sanitizes uploaded filenames before building the storage path. User-provided filenames are not used directly.

## Access Model

- Active users can read facility photo objects.
- Active admins can upload, update, and delete facility photo objects.
- The bucket remains private.
- Employee and admin pages display photos using signed URLs generated server-side.
- Service role credentials must never be used in client components.

## Admin Photo Management

Admins can manage photos from:

- `/admin/facilities/[id]`

Supported actions:

- Upload one JPEG, PNG, or WebP image up to 5 MB.
- Set one photo as the primary facility photo.
- Delete a photo after confirmation.

Audit logs are created for upload, set-primary, and delete actions.

## Manual Verification

Before production launch:

1. Confirm the `facility-photos` bucket exists and is private.
2. Confirm allowed MIME types are limited to JPEG, PNG, and WebP.
3. Log in as admin and upload a valid photo from `/admin/facilities/[id]`.
4. Confirm the storage object is created under `facilities/{facility_id}/`.
5. Confirm a `facility_photos` row is created.
6. Confirm the photo appears on `/facilities` and `/facilities/[slug]` for an active employee.
7. Confirm setting a primary photo updates which image appears first.
8. Confirm deleting a photo removes the storage object and database row.
9. Confirm an employee cannot access admin photo management pages or actions.

