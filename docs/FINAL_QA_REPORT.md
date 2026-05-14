# Final QA Report

Date: 2026-05-11

Scope: Final Product Readiness Step 5 focused on mobile usability, responsive layout, access control, role restrictions, storage assumptions, and production-readiness issues.

## Automated Checks

Initial automated checks completed before this report update:

- `npm.cmd run lint`: pass
- `npm.cmd run typecheck`: pass
- `npm.cmd test`: pass, 7 test files and 28 tests passed

Final verification completed after this report was created:

- `npm.cmd run lint`: pass
- `npm.cmd run typecheck`: pass
- `npm.cmd test`: pass, 7 test files and 28 tests passed
- `npm.cmd run build`: pass
- `npm.cmd run qa`: pass, including lint, tests, and production build

## Mobile QA Checklist

Status: prepared for manual browser execution. Logged-in browser checks were not completed in this pass because no active employee/admin browser sessions or credentials were available in the workspace.

Test these widths in browser dev tools or on physical devices:

- 320px
- 360px
- 390px
- 430px
- 768px
- Desktop width

Public and employee routes to verify:

- `/`
- `/login`
- `/register`
- `/reset-password`
- `/dashboard`
- `/facilities`
- `/facilities/[slug]`
- `/bookings/new`
- `/my-bookings`
- `/bookings/[id]`
- `/calendar`
- `/profile`

Admin routes to verify:

- `/admin/dashboard`
- `/admin/users`
- `/admin/users/[id]`
- `/admin/facilities`
- `/admin/facilities/[id]`
- `/admin/bookings`
- `/admin/bookings/[id]`
- `/admin/approvals`
- `/admin/calendar`
- `/admin/blocked-dates`
- `/admin/maintenance`
- `/admin/email-notifications`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/settings`

For each route, check:

- No unexpected horizontal overflow.
- Buttons and links are at least comfortable tap targets.
- Page titles, descriptions, breadcrumbs, and actions wrap cleanly.
- Forms stack to one column and field errors remain readable.
- Dialogs fit the viewport and actions remain reachable.
- Long email addresses, IDs, subjects, storage paths, and JSON values wrap or scroll safely.
- Tables either show mobile cards or use a clear horizontal scroll container.
- Calendar controls do not become cramped at 320px.
- Mobile navigation opens, closes, shows active state, and exposes logout.
- Focus states remain visible for keyboard navigation.

## Access-Control QA Checklist

Logged-out users:

- `/dashboard`, `/calendar`, `/my-bookings`, `/profile`, and `/admin/*` should redirect to `/login?auth=required`.

Employees:

- Can access employee routes and their own booking details.
- Cannot access `/admin/*`.
- Cannot view another user's booking details.
- Cannot upload, set primary, or delete facility photos.
- Cannot manage users, admin bookings, approvals, settings, reports, audit logs, email processing, blocked dates, or maintenance closures.

Admins:

- Can access operational admin routes and admin actions.
- Can access employee routes if required for operational use.
- Can manage facilities/photos, bookings, approvals, blocked dates, maintenance, reports, audit logs, and email queue processing.
- Cannot manage users/roles or system settings.

Super Admins:

- Can access all admin routes and actions.
- Can manage users, roles, statuses, and system settings.
- Cannot demote or disable themselves through user management.
- Cannot remove the final active super admin.

Disabled or pending users:

- Should be blocked from protected pages by the existing active-user guards.
- Should receive generic contact/admin messaging without exposing private records.

## Server Action And Security Review

Reviewed critical action paths:

- Profile updates use `requireUser()`, update only the current user's safe profile fields, and audit the update.
- Admin user management uses `requireSuperAdmin()`, validates input, blocks self role/status changes, protects final active super admin access, and audits changes.
- Facility photo upload/set-primary/delete use `requireAdmin()`, validate IDs, validate file type and size, use sanitized storage paths, and audit photo changes.
- Employee booking creation and cancellation use `requireUser()`, active profile checks, server validation, ownership checks, and database-backed conflict protection.
- Admin booking approve/reject/cancel actions use `requireAdmin()`, validate remarks, check booking state, and audit/email side effects.
- Settings updates use `requireSuperAdmin()`, validate settings, update `system_settings`, and write `settings_change` audit logs.
- Email queue processing and retry actions use `requireAdmin()` and audit processing activity.
- Report export route helpers use active-admin authorization before generating CSV and export audit records.

No access-control bug requiring code changes was found in this pass.

## Service Role And Secret Review

- `createAdminClient()` remains isolated in the server-only Supabase admin helper.
- `SUPABASE_SERVICE_ROLE_KEY` was only found in server-side code and documentation.
- `EMAIL_API_KEY` was only found in server-side email provider code and documentation.
- No client component imports of `createAdminClient()` were found.
- `.env.example` documents server-only handling for service role and email keys.

## Storage Review

- `facility-photos` is configured as a private bucket in migration `0008_storage_notes.sql`.
- Storage policies allow active users to read facility photo objects and admins to upload/update/delete them.
- Employee facility queries generate signed URLs when a photo row does not have a public URL.
- Photo upload validates JPEG, PNG, and WebP files up to 5 MB at the server action layer.
- Manual browser verification with real Supabase credentials is still required for upload, signed URL display, primary photo changes, and delete behavior.

## Production Environment Readiness

Required Vercel environment variables to verify before deployment:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_TIMEZONE`
- `APP_NAME`
- `COMPANY_NAME`
- `SYSTEM_CONTACT_EMAIL`
- `EMAIL_PROVIDER`
- `EMAIL_API_KEY`
- `EMAIL_FROM`

Production readiness checks:

- Vercel build command should be `npm run build`.
- Node engine is configured in `package.json` as `22.x`.
- Supabase Auth Site URL and redirect URLs must use the production HTTPS URL.
- `SUPABASE_SERVICE_ROLE_KEY` and `EMAIL_API_KEY` must be configured as server-only environment variables.
- Resend can remain unconfigured until the sending domain is ready; queue processing should fail safely with a clear message.

Pre-deployment documentation note:

- `docs/DEPLOYMENT_NOTES.md` and `docs/PRODUCTION_CHECKLIST.md` were updated in Step 6 to document Vercel as the current deployment target.

## Known Remaining Issues

- Authenticated browser QA still needs to be executed with real employee and admin accounts.
- Facility photo storage behavior still needs real upload/delete verification against Supabase Storage.
- Automated browser/mobile E2E tests are not implemented.
- Email sending requires production Resend environment variables and verified sender/domain before real delivery can be tested.

## Pre-Deployment Sign-Off Checklist

- [x] Final automated checks pass: lint, typecheck, test, build, qa.
- [ ] Mobile QA completed at 320px, 360px, 390px, 430px, and 768px.
- [ ] Employee access-control checks completed.
- [ ] Admin access-control checks completed.
- [ ] Disabled/pending user checks completed.
- [ ] Facility photo upload, primary selection, and deletion tested with real storage.
- [ ] Report exports tested and audit/export logs verified.
- [ ] Supabase Auth production URLs configured.
- [ ] Vercel environment variables configured.
- [x] Deployment documentation updated for the chosen production host.
