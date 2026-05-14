# Security Checklist

Phase 14 security and RLS hardening checklist for the internal Booking System.

## Auth Protection Checklist

- [x] Unauthenticated users are redirected away from employee pages.
- [x] Unauthenticated users are redirected away from admin pages.
- [x] Logged-in users with missing, pending, or disabled profiles are blocked from protected app routes.
- [x] Auth pages remain available to unauthenticated users.
- [x] Next.js Proxy is used as an optimistic request gate only; pages, actions, and route handlers still perform server-side checks.

## Admin Authorization Checklist

- [x] Admin pages call `requireAdmin()` or an equivalent active-admin helper before loading privileged data.
- [x] Super-admin-only pages call `requireSuperAdmin()` or an equivalent active-super-admin helper before loading user/setting management data.
- [x] Admin server actions verify active admin authorization before privileged writes.
- [x] User-management and settings server actions verify active super admin authorization before privileged writes.
- [x] Report export route handlers verify active admin authorization before returning CSV data.
- [x] Employees are redirected away from `/admin/*` routes.
- [x] Admin user-management actions keep role/status changes server-side and audit logged.
- [x] Admin users cannot access `/admin/users` or `/admin/settings`; only super admins can.

## RLS Checklist

- [x] RLS is enabled on application tables.
- [x] Employees can select their own bookings and safe invited booking details only.
- [x] Invited employees can view only safe details for bookings they were invited to.
- [x] Employee all-company calendar visibility is settings-gated and shows limited details for unrelated bookings without management/detail links.
- [x] Booking invitation RLS allows owners to invite/remove, invitees to respond, and admins to view/manage.
- [x] Active users can view and update only their own safe profile fields through the self-service profile page.
- [x] Employees cannot directly insert bookings into `public.bookings`; booking creation must use `public.create_booking()`.
- [x] Employee booking cancellation policy only permits transition to `cancelled` for the owner.
- [x] Booking immutability during employee cancellation is backed by a database trigger.
- [x] Employees cannot view audit logs, email notifications, system settings, or export logs except public settings where intended.
- [x] Employees cannot directly access Microsoft 365 calendar sync tracking records.
- [x] Admins can manage required operational data through admin-only policies and server-side actions.
- [x] Super admins can manage users, roles, statuses, and system settings through super-admin-only policies and server-side actions.
- [x] Admins can view future calendar sync records; only super admins can manage future retry/repair records.

## Service Role Checklist

- [x] `createAdminClient()` is marked `server-only`.
- [x] `SUPABASE_SERVICE_ROLE_KEY` is read only in the server-only Supabase admin helper.
- [x] Client components do not import `createAdminClient()`.
- [x] Privileged service-role operations are reached after active-user or active-admin checks; unauthenticated service-role reads are limited to non-secret registration/settings behavior.
- [x] Service role usage is reserved for RLS-bypassing reads/writes such as availability checks, admin actions, audit logs, email queue processing, settings, and exports.
- [x] Invitation service-role actions verify the current user is the booking owner or invitee before writing.

## Environment Variable Checklist

- [x] Browser code uses only `NEXT_PUBLIC_*` variables.
- [x] `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- [x] `EMAIL_API_KEY` is server-only.
- [x] `SMTP_PASSWORD` is server-only.
- [x] `MICROSOFT_CLIENT_SECRET` is server-only.
- [x] Microsoft Graph tokens must never be exposed to client components or browser storage when sync is implemented.
- [x] SMTP provider errors are sanitized before being stored in email notification records.
- [x] Future Microsoft 365 calendar sync errors must be sanitized before being stored in sync tracking records.
- [x] `.env.local` and `.env*` files are ignored by Git.
- [x] Secrets are not displayed in UI.

## Storage Checklist

- [x] `facility-photos` bucket is configured as private in the storage migration.
- [x] Active users can read facility photo objects.
- [x] Admins can upload, update, and delete facility photo objects.
- [x] Facility photo management is admin-only and validates file type and size server-side.
- [x] Employee photo display uses signed URLs for the private bucket instead of exposing service-role credentials.
- [ ] Browser-level storage verification is still required after deploying the photo upload UI.

## Database Function Checklist

- [x] Security definer functions set `search_path = public`.
- [x] `public.is_admin()` requires active admin or super admin profile status.
- [x] `public.is_super_admin()` requires active super admin profile status.
- [x] `public.is_active_user()` requires active profile status.
- [x] `public.create_booking()` checks active user, ownership, active facility, capacity, blocked periods, maintenance closures, and valid time range.
- [x] `bookings_no_overlapping_active` remains the final database conflict guard for pending and confirmed bookings.
- [x] Facility delete is implemented as admin-only archive so historical bookings, reports, photos, and audit logs remain preserved.
- [x] `booking_calendar_syncs` is a tracking table only; it does not perform Microsoft Graph writes by itself.

## Manual Test Checklist

- [ ] Visit `/dashboard`, `/my-bookings`, `/admin/dashboard`, and `/admin/reports` while logged out; expect `/login?auth=required`.
- [ ] Log in as employee and visit `/admin/facilities`, `/admin/bookings`, `/admin/settings`, and `/admin/audit-logs`; expect redirect or access denied.
- [ ] Log in as employee and open an owned booking; expect access.
- [ ] Log in as booking invitee and open the invited booking; expect limited detail access with no cancel/manage controls.
- [ ] Attempt to invite a disabled, pending, duplicate, or owner account; expect a friendly block.
- [ ] Attempt to respond to another user's invitation; expect denial.
- [ ] Log in as employee and update `/profile`; confirm only full name, department, and phone can change.
- [ ] Attempt another user's booking detail as employee; expect not found or access denied.
- [ ] Enable all-company calendar visibility and confirm unrelated employee calendar items show limited details only and do not link to booking detail.
- [ ] Set a profile status to `disabled`; confirm protected pages are blocked.
- [ ] Log in as admin; confirm admin pages still work.
- [ ] Log in as admin; confirm `/admin/users` and `/admin/settings` are hidden and denied.
- [ ] Log in as super admin; confirm `/admin/users` and `/admin/settings` are available.
- [ ] Attempt to demote or disable the final active super admin; expect denial.
- [ ] Confirm no client component imports `createAdminClient()`.
- [ ] Confirm report CSV export is blocked for non-admin users.
- [ ] Confirm employees cannot select `booking_calendar_syncs` records.
- [ ] Confirm admins can view future sync records only through approved admin tooling.
- [ ] Confirm Microsoft 365 Calendar sync remains disabled until Stage 2 implementation is deployed.
- [ ] Confirm Microsoft client secrets and future Graph tokens are not exposed in browser bundles or UI.

## Remaining Risks

- Vercel protection, Cloudflare Access, or another network-layer internal access control is still a future deployment hardening option.
- Admin user-management is implemented; continue to manually verify self-protection and final-active-admin protections in production QA.
- Automated browser/security E2E tests are not implemented yet; continue using the manual QA checklist until those tests exist.
- Facility photo upload is implemented, but storage upload/delete behavior still needs browser-level verification with real Supabase credentials before production launch.
- Microsoft 365 Calendar sync is groundwork only; live Graph event creation and cancellation are not implemented yet.
