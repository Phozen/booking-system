# Deployment Notes

The Booking System is deployed as a full-stack Next.js App Router application on Vercel, with Supabase for auth, database, and storage.

Use these notes for the current MVP deployment and handoff. Do not commit real secrets; configure production values in the Vercel dashboard.

## Deployment Target

Current deployment target:

- Hosting: Vercel
- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: leave blank/default for Vercel Next.js
- Install command: Vercel default, usually `npm install`
- Node.js version: 22.x
- Runtime entry: managed by Vercel

This app uses server actions, route handlers, authenticated admin pages, Supabase server clients, CSV export routes, and dynamic rendering. Do not configure static export.

The repository should not require non-Vercel adapter tooling or adapter-specific build commands for the current deployment. Cloudflare can still be used later for DNS or access control if desired, but it is not the primary app hosting platform.

## Local Verification Before Deploy

Run the full local verification stack before pushing a deployment branch:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run qa
```

The `qa` script runs lint, tests, and production build. `typecheck` is listed separately because the current `qa` script does not run it.

## Required Vercel Environment Variables

Set these in Vercel Project Settings > Environment Variables for Production. Add Preview values too if testing auth or emails from preview deployments.

Public browser-exposed values:

```txt
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Server-only secrets:

```txt
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EMAIL_API_KEY=
```

Server-side app defaults:

```txt
APP_TIMEZONE=Asia/Kuala_Lumpur
APP_NAME=Booking System
COMPANY_NAME=Your Company Name
SYSTEM_CONTACT_EMAIL=admin@example.com
EMAIL_PROVIDER=
EMAIL_FROM=
```

Security rules:

- Only `NEXT_PUBLIC_*` variables are browser-exposed.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- `EMAIL_API_KEY` must remain server-only.
- Real secrets must be entered in Vercel, never committed to the repository.
- Do not store provider API keys in `system_settings`.

Email can remain disabled for MVP testing. If `EMAIL_PROVIDER`, `EMAIL_API_KEY`, or `EMAIL_FROM` is blank, queued email processing should fail safely with a clear configuration message instead of crashing.

## Environment Groups

Production:

- `NEXT_PUBLIC_APP_URL` should be the production Vercel URL until a custom domain is ready.
- Supabase URL and keys should point to the production Supabase project.
- Email variables can remain blank until Resend is configured.

Preview:

- Use the Vercel preview URL for `NEXT_PUBLIC_APP_URL` if testing auth redirects or email links from preview.
- Add the preview URL to Supabase Auth redirect URLs.
- Use a separate Supabase project where possible, or clearly named test users/records if using production Supabase.

Local:

- Store values in `.env.local`.
- Use `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- Leave email provider variables blank unless testing real Resend delivery.

## Supabase Production Setup

1. Confirm the Supabase project is linked locally.
2. Confirm migrations are applied:

```powershell
npx.cmd supabase migration list
npx.cmd supabase db push
```

3. Confirm remote migrations `0001` through `0009` are applied.
4. Confirm RLS is enabled on application tables.
5. Confirm the `bookings_no_overlapping_active` exclusion constraint exists.
6. Confirm default facilities, equipment, and seeded system settings exist.
7. Confirm `system_settings` values are reviewed for production identity and behavior:
   - `app_name`
   - `company_name`
   - `system_contact_email`
   - `registration_enabled`
   - `allowed_email_domains`
   - `default_approval_required`
   - `allow_facility_approval_override`
   - `default_timezone`
   - `reminder_offsets_minutes`

## Facility Photo Storage

The app expects a private Supabase Storage bucket:

```txt
facility-photos
```

Expected bucket settings:

- Public bucket: No
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- App-side max upload size: 5 MB
- Migration bucket limit: 10 MB
- Suggested storage path: `facilities/{facility_id}/{timestamp-or-uuid}-{safe-file-name}`

Storage policy expectations:

- Active users can read facility photo objects.
- Admins can upload, update, and delete facility photo objects.
- Employee UI displays photos through signed URLs when a public URL is not stored.
- Service role credentials are never exposed to the browser.

Before launch, manually test upload, primary photo selection, delete, employee facility list display, and employee facility detail display.

## First Admin Setup

1. Deploy the app.
2. Register the first user through `/register`, if registration is enabled.
3. Promote the first admin in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

4. Log in and open `/admin/dashboard`.
5. Use `/admin/users` for everyday role/status changes after the first admin exists.

## Supabase Auth URLs

For current MVP testing with the Vercel URL, set the Supabase Auth Site URL to:

```txt
https://your-vercel-app.vercel.app
```

Add redirect URLs for:

```txt
http://localhost:3000/**
https://your-vercel-app.vercel.app/**
```

When a custom domain is added later, add:

```txt
https://your-domain.com/**
https://www.your-domain.com/**
```

Current project note: there is no `/auth/callback` route. Password reset currently uses `/reset-password`.

## Resend Email Setup Later

Real email sending is supported but can remain disabled until the sender domain is ready.

When ready:

1. Verify the sender domain or sender email in Resend.
2. Set Vercel environment variables:

```txt
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your-resend-api-key
EMAIL_FROM=Booking System <bookings@your-domain.com>
```

3. Create a booking or approval flow that queues an email notification.
4. Open `/admin/email-notifications`.
5. Click `Process queued emails`.
6. Confirm the notification becomes `sent` and `sent_at` is populated.

If email variables are missing, processing should fail safely and store a clear error on notification records.

## Domain Setup Later

No custom domain is required for current MVP testing. Use the Vercel URL first.

When an Exabytes domain is purchased or ready:

1. Add the custom domain in Vercel.
2. Follow Vercel's DNS instructions for apex/root and `www`.
3. If using Cloudflare for DNS, point Exabytes nameservers to Cloudflare and then configure the Vercel DNS records in Cloudflare.
4. Decide the canonical host:
   - `https://your-domain.com`
   - or `https://www.your-domain.com`
5. Configure redirects for the non-canonical host if needed.
6. Confirm HTTPS certificate status is active.
7. Update Vercel `NEXT_PUBLIC_APP_URL` to the canonical HTTPS URL.
8. Update Supabase Auth Site URL and redirect URLs.
9. Verify the domain in Resend before enabling real email delivery.

## HTTPS Checklist

- [ ] Production URL opens over HTTPS.
- [ ] HTTP redirects to HTTPS, if applicable.
- [ ] `www` and apex behavior is intentional after custom domain setup.
- [ ] Supabase Auth Site URL uses HTTPS.
- [ ] Email templates link to the HTTPS production URL.

## Post-Deployment Smoke Test Checklist

- [ ] Visit homepage.
- [ ] Register a user, if registration is enabled.
- [ ] Log in as employee.
- [ ] Log in as admin.
- [ ] Open `/facilities`.
- [ ] Open a facility detail page.
- [ ] Create a valid booking.
- [ ] Confirm overlapping booking is blocked.
- [ ] Confirm back-to-back booking is allowed.
- [ ] Open `/my-bookings`.
- [ ] Open `/profile`.
- [ ] Open `/calendar`.
- [ ] Open `/admin/dashboard`.
- [ ] Open `/admin/users`.
- [ ] Open `/admin/bookings`.
- [ ] Test approval flow if approval mode is enabled.
- [ ] Upload and view a facility photo.
- [ ] Create and test a blocked period.
- [ ] Create and test a maintenance closure.
- [ ] Open `/admin/email-notifications`.
- [ ] Process queued emails with missing email config and confirm safe failure.
- [ ] Open `/admin/reports`.
- [ ] Export a CSV report.
- [ ] Open `/admin/audit-logs`.
- [ ] Open `/admin/settings`.
- [ ] Log out.

## Rollback Notes

- Vercel keeps prior deployments available; use Vercel rollback if a release fails smoke tests.
- If deployment fails before release, keep the previous successful deployment active.
- If a migration causes a production data issue, stop writes first, inspect the migration, and apply a targeted fix migration. Do not run destructive SQL without a backup.
- Keep Supabase backups enabled for production.

## Known Limitations

- Authenticated mobile QA still needs manual execution with real employee/admin accounts.
- Facility photo storage needs real Supabase upload/delete verification before launch.
- Automatic email cron/background processing is deferred.
- Reminder scheduling automation is deferred.
- PDF and Excel exports are deferred.
- Recurring bookings are deferred.
- Dark mode is deferred.
- Collaboration/invitations are deferred.
- Vercel protection, Cloudflare Access, or another network-layer internal access gate is a future hardening option.

## Reference Links

- Vercel Next.js deployment: https://vercel.com/docs/frameworks/nextjs
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Supabase Auth redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
