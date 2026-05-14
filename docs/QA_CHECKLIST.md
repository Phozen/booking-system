# QA Checklist

Phase 15 manual and automated QA checklist for the internal Booking System.

Use this checklist after migrations are applied and the app is running with real Supabase credentials. Mark each item with the tester name, date, environment, and evidence where practical.

## Preflight

- [ ] Confirm `.env.local` contains the correct Supabase URL, anon key, service role key, app URL, and timezone.
- [ ] Confirm `npx.cmd supabase migration list` shows local and remote migrations `0001` through `0013`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Confirm the dev server opens at `http://localhost:3000`.
- [ ] Confirm no private env values appear in browser source, console output, or rendered UI.

## Authentication

- [ ] Open `/login`; confirm email/password form renders.
- [ ] Log in with valid employee credentials; expect `/dashboard`.
- [ ] Log in with valid admin or super admin credentials; expect `/admin/dashboard`.
- [ ] Try invalid credentials; expect a generic friendly error.
- [ ] Use logout; expect redirect to `/login`.
- [ ] Open `/reset-password`; submit a valid email; expect generic reset success messaging.
- [ ] Confirm unauthenticated `/dashboard`, `/facilities`, `/bookings/new`, `/my-bookings`, and `/admin/dashboard` redirect to `/login?auth=required`.

## Registration Settings

- [ ] Set `registration_enabled=false` in `/admin/settings`; log out; confirm `/register` shows registration disabled.
- [ ] Set `registration_enabled=true` and `allowed_email_domains=[]`; confirm any valid email domain can register.
- [ ] Set `allowed_email_domains=["example.com"]`; confirm `user@example.com` can register.
- [ ] With the same domain setting, confirm `user@gmail.com` is blocked with a friendly message.
- [ ] Confirm duplicate email signup shows a friendly existing-account message.
- [ ] Confirm signup rate limit errors show the wait-and-try-again message.

## Role-Based Access

- [ ] Employee can access `/dashboard`, `/facilities`, `/bookings/new`, and `/my-bookings`.
- [ ] Employee can access `/profile`.
- [ ] Employee cannot access `/admin/facilities`, `/admin/bookings`, `/admin/approvals`, `/admin/reports`, `/admin/audit-logs`, or `/admin/settings`.
- [ ] Admin can access operational admin pages: bookings, approvals, facilities, calendar, blocked dates, maintenance, email notifications, reports, and audit logs.
- [ ] Admin cannot access `/admin/users` or `/admin/settings`.
- [ ] Admin navigation does not show Users or Settings.
- [ ] Super Admin can access all admin pages, including `/admin/users` and `/admin/settings`.
- [ ] Admin can access `/profile` and update only their own safe profile fields.
- [ ] Admin can still access employee facility browsing pages if needed.
- [ ] Report export routes redirect or deny non-admin users.

## Disabled And Pending Users

- [ ] Set a test employee profile status to `disabled`; confirm login/protected pages are blocked.
- [ ] Set a test employee profile status to `pending`; confirm protected pages are blocked.
- [ ] Restore the test profile to `active`; confirm access returns.
- [ ] Confirm disabled users cannot create bookings or cancel bookings through normal app flows.

## Facility Browsing

- [ ] Open `/facilities` as employee; confirm active non-archived facilities render.
- [ ] Confirm the five default facilities are present.
- [ ] Open each facility detail page; confirm name, level, type, capacity, equipment, description, status, and approval indicator display.
- [ ] Confirm inactive or archived facilities are hidden from employee list.
- [ ] Confirm the "Book this facility" link opens `/bookings/new?facilityId=...`.
- [ ] Confirm placeholder/photo display does not break layout.

## Admin Facility Management

- [ ] Open `/admin/facilities`; confirm facility table displays code, name, level, type, capacity, status, approval, and edit actions.
- [ ] Create a test facility with unique code and slug.
- [ ] Edit the test facility fields.
- [ ] Change facility status and confirm audit log records the update.
- [ ] Archive or mark the test facility inactive; confirm it is no longer bookable by employees.
- [ ] Use the danger-zone archive action from `/admin/facilities/[id]`; confirm the dialog explains that historical bookings and reports are preserved.
- [ ] Confirm archived facilities remain visible to admins with `Archived` status and are hidden from employee facility browsing.
- [ ] Confirm invalid capacity, duplicate code, or duplicate slug is rejected.
- [ ] Upload a valid JPEG, PNG, or WebP facility photo up to 5 MB from `/admin/facilities/[id]`.
- [ ] Confirm invalid file types and files over 5 MB show friendly errors.
- [ ] Upload two photos and set the second photo as primary; confirm only one photo is primary.
- [ ] Delete a non-primary photo; confirm it is removed from the grid.
- [ ] Delete a primary photo; confirm another remaining photo becomes primary or the placeholder appears if none remain.
- [ ] Confirm facility photo upload, primary change, and delete actions create audit log records.
- [ ] Confirm employees can view facility photos on `/facilities` and `/facilities/[slug]` but cannot access photo management controls.

## Booking Creation

- [ ] As active employee, open `/facilities`, choose a facility, and click "Book this facility".
- [ ] Create a valid booking with title, date, start time, end time, and attendee count.
- [ ] Confirm redirect to `/bookings/[id]?created=1&invite=1`.
- [ ] Confirm booking detail shows the created/pending success alert and highlights the invitation form.
- [ ] Confirm the post-booking prompt offers Invite users, Skip for now, Back to My Bookings, and View Calendar.
- [ ] Confirm booking appears in `/my-bookings`.
- [ ] Confirm booking detail page shows facility, date/time, status, title, description, attendee count, created date, and updated date.
- [ ] Confirm attendee count above facility capacity is rejected.
- [ ] Confirm start time equal to or after end time is rejected.
- [ ] Confirm booking an inactive, archived, or under-maintenance facility is rejected.

## Booking Conflict Prevention

- [ ] Create a booking for a facility from 10:00 to 11:00.
- [ ] Attempt another booking for the same facility from 10:30 to 11:30; expect a friendly conflict error.
- [ ] Confirm the second booking is not created.
- [ ] Confirm direct SQL overlap test fails because of `bookings_no_overlapping_active`.
- [ ] Confirm employees cannot bypass app flow with direct table insert under RLS.

## Back-To-Back Booking Behavior

- [ ] Create a booking from 10:00 to 11:00.
- [ ] Create another booking for the same facility from 11:00 to 12:00.
- [ ] Confirm both bookings succeed.
- [ ] Confirm SQL back-to-back verification script succeeds.

## My Bookings

- [ ] Confirm `/my-bookings` shows only the current employee's bookings.
- [ ] Confirm upcoming, past/history, cancelled, and pending states are distinguishable.
- [ ] Confirm each booking links to `/bookings/[id]`.
- [ ] Confirm invited meetings are surfaced separately with a link to `/invitations` when invitations exist.
- [ ] Attempt to open another user's booking detail URL; expect not found or access denied.

## Booking Invitations

- [ ] After creating a booking, invite an active user directly from the highlighted booking detail invitation form.
- [ ] As a booking owner, open an owned booking and invite another active internal user.
- [ ] Confirm the invited attendee appears as `Pending`.
- [ ] Confirm duplicate invitations are blocked with a friendly message.
- [ ] Confirm the booking owner cannot invite themselves.
- [ ] Confirm disabled and pending users cannot be invited.
- [ ] As the invited user, open `/invitations`; confirm pending, accepted, and declined groups render.
- [ ] Accept a pending invitation; confirm status changes to `Accepted` and an audit log is created.
- [ ] Decline another pending invitation; confirm status changes to `Declined` and an audit log is created.
- [ ] Open the invited booking detail; confirm the invitee sees safe details and cannot cancel or manage attendees.
- [ ] As owner, remove an invited attendee; confirm the attendee no longer appears on the booking detail.
- [ ] Confirm invitation-created, accepted, declined, and removed actions create audit log records.
- [ ] Confirm invitation email notification records are queued when the invitation email enum values are applied.
- [ ] Check `/invitations` and invited booking detail on mobile and in dark mode.

## Profile

- [ ] Open `/profile` as an employee; confirm full name, email, role, status, department, phone, last login, created date, and updated date display.
- [ ] Update full name, department, and phone; confirm values persist after refresh.
- [ ] Confirm email, role, status, user ID, created date, updated date, and auth provider fields are read-only.
- [ ] Open `/profile` as an admin; confirm admin can update only their own safe profile fields.
- [ ] Confirm profile update creates an audit log entry with action `update` and entity type `user`.
- [ ] Confirm logged-out `/profile` redirects to `/login?auth=required`.
- [ ] Confirm disabled or pending users cannot access `/profile`.
- [ ] Check `/profile` at mobile width; confirm the form and read-only details fit without horizontal overflow.

## Employee Cancellation

- [ ] Cancel an own `pending` booking with a reason.
- [ ] Cancel an own `confirmed` booking without a reason.
- [ ] Confirm status becomes `cancelled`.
- [ ] Confirm `cancelled_by`, `cancelled_at`, and optional `cancellation_reason` are stored.
- [ ] Confirm audit log entry is created.
- [ ] Confirm `booking_cancellation` email notification is queued.
- [ ] Confirm already cancelled, rejected, completed, or expired bookings cannot be cancelled.

## Admin Booking Management

- [ ] Open `/admin/bookings`; confirm all bookings are visible.
- [ ] Filter bookings by status and facility.
- [ ] Open an admin booking detail page; confirm booking, facility, user, approval, cancellation, and timestamps display.
- [ ] Cancel another user's pending or confirmed booking as admin with a reason.
- [ ] Confirm audit log and cancellation email queue records are created.
- [ ] Confirm employee users cannot perform admin booking actions by POSTing or using hidden controls.
- [ ] Open an admin booking detail page and confirm invited attendee names, emails, statuses, and response dates are visible.

## Admin Approvals

- [ ] Enable approval mode globally or for a facility.
- [ ] As employee, create a booking; confirm status is `pending`.
- [ ] Open `/admin/approvals`; confirm pending booking appears.
- [ ] Approve the booking; confirm status becomes `confirmed`.
- [ ] Confirm approval record has `approved`, `reviewed_by`, `reviewed_at`, and remarks if entered.
- [ ] Confirm `booking_approval` notification and audit log records are created.
- [ ] Create another pending booking and reject it; confirm status becomes `rejected`.
- [ ] Confirm `booking_rejection` notification and audit log records are created.
- [ ] Create an approval conflict scenario; confirm approval fails with a friendly conflict message.

## Blocked Periods

- [ ] Create an all-facilities blocked period.
- [ ] Attempt to book any facility during that period; expect blocked-period error.
- [ ] Create a selected-facility blocked period for `MR-L5-01`.
- [ ] Confirm `MR-L5-01` is blocked during that time.
- [ ] Confirm another facility remains bookable during that same time.
- [ ] Edit blocked period details; confirm updated behavior and audit log.
- [ ] Deactivate blocked period; confirm it no longer blocks bookings.

## Maintenance Closures

- [ ] Create a scheduled maintenance closure for one facility.
- [ ] Attempt to book that facility during the closure; expect maintenance error.
- [ ] Confirm other facilities remain bookable.
- [ ] Change closure to `in_progress`; confirm it still blocks.
- [ ] Complete the closure; confirm it no longer blocks new bookings.
- [ ] Create another closure and cancel it; confirm it does not block.
- [ ] Confirm each state change creates an audit log.

## Email Notification Queue

- [ ] Create an automatically confirmed booking; confirm `booking_confirmation` notification is queued.
- [ ] Approve a pending booking; confirm approval notification is queued.
- [ ] Reject a pending booking; confirm rejection notification is queued.
- [ ] Cancel a booking; confirm cancellation notification is queued.
- [ ] Open `/admin/email-notifications`; confirm notification records display type, status, recipient, subject, attempts, scheduled time, sent time, and errors.
- [ ] Process queued emails with missing provider config; confirm app does not crash and records show clear failure.
- [ ] Retry failed notifications after fixing config.
- [ ] Optional: configure Resend and confirm a real email sends and `sent_at` is populated.

## Reports

- [ ] Open `/admin/reports`; confirm summary metrics render.
- [ ] Confirm booking history, facility utilization, user booking summary, cancelled bookings, and audit log previews render.
- [ ] Apply date range, facility, and status filters.
- [ ] Confirm totals and tables update consistently.
- [ ] Confirm empty states render for ranges with no data.

## CSV Exports

- [ ] Export booking history CSV; confirm download and readable headers.
- [ ] Export facility utilization CSV; confirm room-level totals.
- [ ] Export user booking summary CSV; confirm user-level totals.
- [ ] Export cancelled bookings CSV; confirm cancellation reason column.
- [ ] Export audit logs CSV; confirm action/entity/actor columns.
- [ ] Confirm commas, quotes, and newlines are escaped correctly.
- [ ] Confirm `export_logs` record is created.
- [ ] Confirm `audit_logs` export record is created.
- [ ] Confirm employee users cannot download report CSVs.

## Audit Logs

- [ ] Open `/admin/audit-logs`; confirm recent logs display.
- [ ] Filter by date range, actor email, action, and entity type.
- [ ] Open an audit log detail page; confirm metadata, old values, and new values render as readable JSON.
- [ ] Perform a facility update; confirm new audit log appears.
- [ ] Perform a booking cancellation; confirm new audit log appears.
- [ ] Confirm employees cannot access audit log pages.

## System Settings

- [ ] Open `/admin/settings` as Super Admin; confirm seeded/default settings display.
- [ ] Open `/admin/settings` as Admin; confirm access is denied or redirected.
- [ ] Update app name or company name; confirm value persists.
- [ ] Confirm updated app name appears on the homepage, auth shell, employee header, and admin shell after refresh.
- [ ] Confirm company name appears in auth/homepage copy, or a neutral fallback appears when blank.
- [ ] Set `system_contact_email`; confirm registration-disabled, inactive-account, empty facility/contact messages use the email.
- [ ] Clear `system_contact_email`; confirm messages fall back to "contact an administrator" without a blank label.
- [ ] Change `default_timezone`; confirm booking, calendar, blocked-period, and maintenance helper text uses the configured timezone.
- [ ] Confirm audit log for `settings_change`.
- [ ] Toggle `default_approval_required`; confirm future bookings follow it.
- [ ] Toggle facility approval override; confirm global default controls when override is disabled.
- [ ] Set calendar visibility to `my_bookings_only`; confirm employees cannot choose All bookings on `/calendar`.
- [ ] Set calendar visibility to `all_company_bookings`; confirm employees can toggle My bookings / All bookings on `/calendar`.
- [ ] In month view, confirm adjacent-month date numbers are not shown; for example, May should not display June 1.
- [ ] Confirm facility detail and booking form approval copy matches the effective approval setting.
- [ ] Update reminder offsets; confirm validation accepts positive integer list.
- [ ] Confirm secrets are not stored in `system_settings`.

## RLS And Security Behavior

- [ ] Confirm service role key is never used in client components.
- [ ] Confirm `EMAIL_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are not exposed to browser bundles.
- [ ] Confirm active employees can select their own bookings and safe invited booking details only.
- [ ] Confirm employees cannot insert direct booking rows and must use `public.create_booking()`.
- [ ] Confirm employees cannot update other users' bookings.
- [ ] Confirm employees cannot view or update invitations for unrelated bookings.
- [ ] Confirm invited employees can view only their own invitations and safe booking details.
- [ ] Confirm employee all-company calendar view shows limited unrelated booking details and does not link to `/bookings/[id]` for unrelated bookings.
- [ ] Confirm employees cannot cancel, manage, or open detail pages for unrelated all-company calendar bookings.
- [ ] Confirm employees cannot view audit logs, export logs, email notifications, or private settings.
- [ ] Confirm active admins can manage expected admin records.
- [ ] Confirm only super admins can update profiles through user management.
- [ ] Confirm only super admins can update system settings.
- [ ] Confirm the final active super admin cannot be demoted or disabled.
- [ ] Confirm storage bucket `facility-photos` is private and policies match `docs/SECURITY_CHECKLIST.md`.

## Production Build

- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Run `npm.cmd run qa`.
- [ ] For Vercel deployment, confirm the project build command is `npm run build` and no non-Vercel adapter build command is required.
- [ ] If the deployment target changes away from Vercel later, add and run that host's adapter-specific build checks separately.
- [ ] Confirm route list includes employee, admin, auth, and export routes.
- [ ] Confirm build does not require live email provider env vars.
- [ ] Confirm build does not expose service role or email provider secrets.

## Basic Responsive UI

- [ ] Check `/login`, `/register`, `/dashboard`, `/facilities`, `/bookings/new`, `/my-bookings`, `/invitations`, `/admin/bookings`, `/admin/reports`, and `/admin/settings` at mobile width.
- [ ] Check the same pages at desktop width.
- [ ] Confirm forms fit without clipped text.
- [ ] Confirm tables scroll horizontally on small screens where needed.
- [ ] Confirm buttons, inputs, labels, and status badges remain readable.
- [ ] Confirm no major content overlap or layout shift during form errors.

## Visual Design And Contrast

- [ ] In light mode, check dashboard, facilities, booking form, calendar, profile, admin dashboard, admin users, admin bookings, and admin settings for clear section/card separation.
- [ ] In dark mode, check the same pages and confirm accents remain readable without becoming overly saturated.
- [ ] Confirm primary, secondary, outline, ghost, destructive, success, and warning buttons are visually distinct and keep visible focus rings.
- [ ] Confirm status badges for bookings, facilities, invitations, users, email notifications, maintenance, and blocked periods are distinguishable by text plus color.
- [ ] Confirm employee quick action cards and admin operational cards use purposeful accents without looking playful.
- [ ] Confirm table/filter panels, mobile record cards, empty states, loading states, and error states have enough contrast against the page background.
- [ ] Confirm calendar today marker, booking events, invited booking labels, and mobile agenda cards are easy to scan.
- [ ] Confirm accent changes do not introduce horizontal overflow or cramped controls on mobile.

## Dark Mode

- [ ] Confirm the auth-page theme toggle sits in the top-right corner outside the form card.
- [ ] Set theme to Light from the auth-page toggle and confirm the preference is applied.
- [ ] Set theme to Dark from the auth-page toggle and confirm the preference is applied.
- [ ] Refresh after changing theme and confirm the selected preference persists.
- [ ] Log in and confirm the signed-in user menu exposes a Light/Dark toggle.
- [ ] Confirm no visible System theme option appears in auth or signed-in UI.
- [ ] Check homepage, login, register, and reset password in dark mode.
- [ ] Check employee dashboard, facilities, facility detail, booking form, My Bookings, invitations, booking detail, calendar, and profile in dark mode.
- [ ] Check admin dashboard, users, facilities, bookings, approvals, calendar, blocked dates, maintenance, email notifications, reports, audit logs, and settings in dark mode.
- [ ] Confirm buttons, status badges, dialogs, forms, cards, tables, alerts, empty states, and calendar events have readable contrast.
- [ ] Confirm focus rings remain visible in dark mode.
- [ ] Confirm status labels do not rely only on color in dark mode.
- [ ] Confirm mobile menu, dialogs, booking form, calendar, and admin cards remain usable in dark mode.

## Known Deferred Items

- [ ] Admin user management UI is implemented; complete the admin users manual tests before production launch.
- [ ] Advanced facility photo UX such as bulk upload, cropping, compression, and drag-and-drop is deferred.
- [ ] Automatic email cron/background processing is deferred.
- [ ] Reminder scheduling automation is deferred.
- [ ] PDF and Excel exports are deferred.
- [ ] Recurring bookings are deferred.
- [ ] Production deployment remains pending; keep deployment documentation aligned with the chosen host before launch.
- [ ] Vercel protection, Cloudflare Access, or another network-layer internal restriction is a deployment hardening option.
