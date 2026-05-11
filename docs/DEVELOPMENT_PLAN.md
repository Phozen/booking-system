Paste this into:

```txt
docs/DEVELOPMENT_PLAN.md
```

````md
# Booking System Development Plan

## 1. Purpose

This document defines the development plan for the internal company Booking System.

The system will allow employees to book meeting rooms and an event hall, while admins can manage facilities, users, bookings, approvals, blocked dates, maintenance closures, reports, exports, audit logs, and system settings.

This project is intended to be developed using Codex with a step-by-step implementation workflow.

---

## 2. Technology Stack

### 2.1 Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table, recommended for admin tables
- date-fns, recommended for date/time formatting

### 2.2 Backend

- Next.js App Router
- Server Actions or Route Handlers
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security

### 2.3 Database

- PostgreSQL through Supabase

### 2.4 Hosting

- Vercel

### 2.5 Domain

- Custom domain purchased from Exabytes
- DNS managed through Vercel or the chosen DNS provider when a custom domain is ready

### 2.6 Email

The email provider is configurable.

Recommended options:

- Resend
- SendGrid
- Mailgun
- SMTP provider

The application should isolate email sending behind a small internal email service layer so the provider can be changed later.

---

## 3. Core Facilities

The initial system must include five bookable facilities:

| Facility Code | Name | Level | Type |
|---|---|---:|---|
| MR-L5-01 | Meeting Room 1 | Level 5 | Meeting Room |
| MR-L5-02 | Meeting Room 2 | Level 5 | Meeting Room |
| MR-L6-01 | Meeting Room 1 | Level 6 | Meeting Room |
| MR-L6-02 | Meeting Room 2 | Level 6 | Meeting Room |
| EH-L1-01 | Event Hall | Level 1 | Event Hall |

These should be inserted through a seed script or migration.

Admins must be able to update their details later.

---

## 4. Development Principles

Codex should follow these principles throughout development:

1. Build incrementally.
2. Keep each task small and testable.
3. Avoid implementing advanced features before the core booking flow works.
4. Prioritize database correctness for booking conflicts.
5. Do not rely only on frontend checks for booking availability.
6. Keep admin and employee functionality clearly separated.
7. Use TypeScript types consistently.
8. Centralize validation using Zod schemas where practical.
9. Centralize Supabase clients and database access helpers.
10. Keep email provider implementation replaceable.
11. Ensure protected routes are enforced.
12. Use clear, maintainable folder names.
13. Add audit logging for important actions.
14. Make configurable behavior database-driven where practical.

---

## 5. Recommended Project Structure

The project should use a clear Next.js App Router structure.

```txt
booking-system/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  ├─ register/
│  │  └─ reset-password/
│  ├─ (app)/
│  │  ├─ dashboard/
│  │  ├─ facilities/
│  │  ├─ bookings/
│  │  ├─ my-bookings/
│  │  └─ profile/
│  ├─ admin/
│  │  ├─ dashboard/
│  │  ├─ bookings/
│  │  ├─ facilities/
│  │  ├─ users/
│  │  ├─ approvals/
│  │  ├─ reports/
│  │  ├─ audit-logs/
│  │  ├─ blocked-dates/
│  │  ├─ maintenance/
│  │  └─ settings/
│  ├─ api/
│  │  ├─ bookings/
│  │  ├─ reports/
│  │  ├─ exports/
│  │  └─ emails/
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ ui/
│  ├─ auth/
│  ├─ bookings/
│  ├─ facilities/
│  ├─ admin/
│  ├─ reports/
│  └─ shared/
├─ config/
│  ├─ app.ts
│  └─ navigation.ts
├─ docs/
│  ├─ REQUIREMENTS.md
│  ├─ DEVELOPMENT_PLAN.md
│  ├─ DATABASE_SCHEMA.md
│  ├─ USER_FLOWS.md
│  ├─ CODEX_TASKS.md
│  └─ DEPLOYMENT_NOTES.md
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ server.ts
│  │  ├─ middleware.ts
│  │  └─ admin.ts
│  ├─ auth/
│  ├─ bookings/
│  ├─ facilities/
│  ├─ email/
│  ├─ reports/
│  ├─ audit/
│  ├─ exports/
│  ├─ validation/
│  └─ utils.ts
├─ proxy.ts
├─ supabase/
│  ├─ migrations/
│  ├─ seed.sql
│  └─ functions/
├─ types/
│  ├─ database.types.ts
│  ├─ app.ts
│  └─ booking.ts
├─ .env.example
├─ package.json
└─ README.md
````

---

## 6. Development Phases

## Phase 1: Project Setup

### Goal

Create the base Next.js project and prepare the development environment.

### Tasks

1. Create a Next.js app with TypeScript, Tailwind CSS, ESLint, and App Router.
2. Install and configure shadcn/ui.
3. Install required dependencies.
4. Create the recommended folder structure.
5. Add `.env.example`.
6. Add base app configuration.
7. Add basic layout.
8. Add initial navigation configuration.
9. Confirm the app runs locally.
10. Confirm the production build works.

### Recommended Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers date-fns
npm install @tanstack/react-table
npm install lucide-react
```

Optional later:

```bash
npm install resend
npm install papaparse
```

### Deliverables

* Working Next.js app
* Tailwind configured
* shadcn/ui configured
* Base folder structure
* `.env.example`
* Successful local run
* Successful build

### Done When

```bash
npm run dev
npm run build
```

both run successfully.

---

## Phase 2: Supabase Setup

### Goal

Connect the app to Supabase for authentication, database, and storage.

### Tasks

1. Create Supabase project.
2. Add environment variables.
3. Create Supabase browser client.
4. Create Supabase server client.
5. Create Supabase middleware client.
6. Create service role client for server-only admin tasks.
7. Set up auth callback handling if needed.
8. Add authentication middleware.
9. Create initial database migration.
10. Enable Row Level Security for relevant tables.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
APP_TIMEZONE=Asia/Kuala_Lumpur
```

### Deliverables

* Supabase clients
* Middleware protection foundation
* Initial migrations
* Local environment setup

### Done When

The app can connect to Supabase and read/write from a test table in development.

---

## Phase 3: Authentication and User Profiles

### Goal

Allow users to register, log in, log out, reset passwords, and receive roles.

### Tasks

1. Build login page.
2. Build registration page.
3. Build password reset page.
4. Add logout action.
5. Create `profiles` table linked to Supabase Auth users.
6. Add profile creation flow after signup.
7. Add role support.
8. Add admin/employee route guards.
9. Add configurable registration behavior.
10. Add allowed email domain support.

### Required Roles

* `employee`
* `admin`

### Required Auth Pages

* `/login`
* `/register`
* `/reset-password`

### Required Protected Areas

* Employee app area
* Admin area

### Deliverables

* Working email/password authentication
* Profile creation
* Role-based routing
* Protected admin routes

### Done When

* Employees can log in and access employee pages.
* Admins can log in and access admin pages.
* Employees cannot access admin pages.
* Logged-out users cannot access protected pages.

---

## Phase 4: Database Schema and Seed Data

### Goal

Create the core database structure needed for facilities, bookings, settings, logs, and admin features.

### Tasks

1. Create database enums.
2. Create `profiles` table.
3. Create `facilities` table.
4. Create `facility_photos` table.
5. Create `equipment` table.
6. Create `facility_equipment` table.
7. Create `bookings` table.
8. Create booking conflict prevention logic.
9. Create `booking_approvals` table.
10. Create `blocked_periods` table.
11. Create `maintenance_closures` table.
12. Create `email_notifications` table.
13. Create `audit_logs` table.
14. Create `system_settings` table.
15. Seed the five initial facilities.
16. Seed default system settings.
17. Add indexes.
18. Add Row Level Security policies.

### Critical Requirement

The database must prevent overlapping active bookings for the same facility.

Overlapping active bookings include bookings with these statuses:

* `pending`
* `confirmed`

Cancelled, rejected, completed, and expired bookings should not block new bookings.

### Deliverables

* Complete database schema
* Seed data
* RLS policies
* Conflict prevention at database level

### Done When

It is impossible to insert two overlapping active bookings for the same facility.

---

## Phase 5: Facility Management

### Goal

Allow employees to view facilities and admins to manage them.

### Employee Features

1. View facility list.
2. View facility detail.
3. See capacity.
4. See equipment.
5. See photos.
6. See facility status.
7. Start a booking from facility page.

### Admin Features

1. Create facility.
2. Edit facility.
3. Archive facility.
4. Set facility status.
5. Upload photos.
6. Mark primary photo.
7. Add or remove equipment.
8. Configure whether approval is required for the facility.

### Deliverables

* Facility list
* Facility detail page
* Admin facility management page
* Facility form
* Photo upload support

### Done When

* Employees can browse facilities.
* Admins can fully manage facility details.
* Photos display correctly.

---

## Phase 6: Booking Creation and Availability

### Goal

Allow users to create bookings while preventing conflicts.

### Tasks

1. Build booking creation form.
2. Add facility selector.
3. Add date picker.
4. Add start and end time inputs.
5. Add purpose/title field.
6. Add optional description.
7. Add optional attendee count.
8. Validate input with Zod.
9. Check facility availability before submit.
10. Check blocked periods.
11. Check maintenance closures.
12. Check existing active bookings.
13. Create booking as `confirmed` or `pending` based on settings.
14. Show conflict warnings.
15. Create audit log entry.
16. Queue email notification record.

### Booking Status Logic

If approval is not required:

```txt
new booking -> confirmed
```

If approval is required:

```txt
new booking -> pending
```

### Conflict Rules

The app must prevent conflicts when:

* Same facility
* Overlapping time range
* Existing booking is `pending` or `confirmed`

### Deliverables

* Booking form
* Availability check
* Conflict warning UI
* Booking creation server action or route handler
* Audit log on booking creation

### Done When

* A user can create a valid booking.
* The system blocks overlapping bookings.
* The system blocks bookings during maintenance closures.
* The system blocks bookings during blocked periods.
* Booking status follows approval configuration.

---

## Phase 7: Employee Booking Management

### Goal

Allow employees to manage their own bookings.

### Tasks

1. Build employee dashboard.
2. Build `My Bookings` page.
3. Add upcoming bookings section.
4. Add past bookings section.
5. Add booking status indicators.
6. Add booking detail page.
7. Allow user cancellation.
8. Add cancellation reason field.
9. Create cancellation audit log.
10. Queue cancellation email notification.

### Deliverables

* Employee dashboard
* My bookings page
* Booking detail page
* User cancellation flow

### Done When

* Employees can view their bookings.
* Employees can cancel their own bookings.
* Employees cannot view or manage other employees’ bookings.

---

## Phase 8: Admin Booking Management and Approvals

### Goal

Allow admins to manage all bookings and approval workflows.

### Tasks

1. Build admin dashboard.
2. Build admin bookings page.
3. Add filters by facility, date range, status, and user.
4. Add booking detail view.
5. Allow admin to create booking on behalf of a user.
6. Allow admin cancellation.
7. Build pending approvals page.
8. Add approve action.
9. Add reject action.
10. Add approval/rejection remarks.
11. Create approval audit logs.
12. Queue approval/rejection email notifications.

### Deliverables

* Admin bookings table
* Admin booking detail view
* Pending approvals page
* Approval and rejection actions

### Done When

* Admins can see all bookings.
* Admins can approve pending bookings.
* Admins can reject pending bookings.
* Employees receive status changes.
* Audit logs are created.

---

## Phase 9: Blocked Dates and Maintenance Closures

### Goal

Allow admins to mark facilities unavailable for non-booking reasons.

### Tasks

1. Build blocked periods database operations.
2. Build blocked periods admin page.
3. Add create/edit/delete blocked period forms.
4. Allow blocking one facility, multiple facilities, or all facilities.
5. Build maintenance closures database operations.
6. Build maintenance closures admin page.
7. Add create/edit/complete/cancel maintenance closure forms.
8. Ensure booking availability checks include blocked periods.
9. Ensure booking availability checks include maintenance closures.
10. Add audit logging.

### Deliverables

* Blocked periods management
* Maintenance closures management
* Availability integration

### Done When

* Admins can block facilities.
* Admins can create maintenance closures.
* Users cannot book unavailable times.

---

## Phase 10: Email Notifications

### Goal

Send emails for booking confirmation, approval, rejection, cancellation, and reminders.

### Tasks

1. Choose email provider.
2. Create email service interface.
3. Add provider implementation.
4. Create email templates.
5. Create notification queue table.
6. Add email queue processing.
7. Add retry handling.
8. Add failure logging.
9. Add reminder email process.
10. Add environment variables.

### Required Emails

* Booking confirmation
* Booking approval
* Booking rejection
* Booking cancellation
* Booking reminder

### Recommended Email Architecture

Use an internal service layer:

```txt
lib/email/
├─ index.ts
├─ provider.ts
├─ templates.ts
├─ queue.ts
└─ send.ts
```

### Deliverables

* Email provider integration
* Templates
* Queue records
* Reminder logic

### Done When

* Confirmation emails send.
* Approval emails send.
* Rejection emails send.
* Cancellation emails send.
* Reminder emails can be triggered.

---

## Phase 11: Reports and Exports

### Goal

Allow admins to view reports and export data.

### Tasks

1. Build reports dashboard.
2. Add booking history report.
3. Add facility utilization report.
4. Add user booking report.
5. Add cancelled bookings report.
6. Add approval report.
7. Add maintenance closure report.
8. Add blocked date report.
9. Add audit log report.
10. Add filters.
11. Add CSV export.
12. Add optional PDF export later.
13. Add optional Excel export later.
14. Add audit log for export actions.

### Required Filters

* Date range
* Facility
* Facility type
* User
* Booking status
* Approval status
* Level

### Required Metrics

* Total bookings
* Confirmed bookings
* Cancelled bookings
* Rejected bookings
* Pending bookings
* Total booked hours
* Facility utilization
* Most frequently booked facilities
* Most active users

### Deliverables

* Reports pages
* Report filters
* CSV export

### Done When

Admins can view and export booking report data as CSV.

---

## Phase 12: Audit Logs

### Goal

Record and display important system activity.

### Tasks

1. Create audit logging utility.
2. Add logs for booking actions.
3. Add logs for facility actions.
4. Add logs for admin user actions.
5. Add logs for blocked periods.
6. Add logs for maintenance closures.
7. Add logs for system settings.
8. Add logs for exports.
9. Build admin audit logs page.
10. Add filters.

### Audit Log Filters

* Date range
* Actor
* Action type
* Entity type

### Deliverables

* Audit logging utility
* Audit logs admin page
* Audit log filters

### Done When

Admins can review important system actions in a read-only audit log table.

---

## Phase 13: System Settings

### Goal

Allow admins to configure system behavior.

### Tasks

1. Build settings database operations.
2. Build admin settings page.
3. Add registration enabled setting.
4. Add allowed email domains setting.
5. Add default approval mode setting.
6. Add per-facility approval override setting.
7. Add reminder timing settings.
8. Add company name setting.
9. Add app name setting.
10. Add system contact email setting.
11. Log setting changes.

### Deliverables

* Admin settings page
* Settings read/write helpers
* Configurable behavior

### Done When

Admins can update system settings and changes affect application behavior.

---

## Phase 14: Security and Row Level Security

### Goal

Harden authorization and database access.

### Tasks

1. Review all protected routes.
2. Review all server actions.
3. Review all API route handlers.
4. Enable RLS on required tables.
5. Add employee policies.
6. Add admin policies.
7. Ensure service role is only used server-side.
8. Ensure no secret is exposed to the browser.
9. Check storage policies for facility photos.
10. Add authorization tests where practical.

### Deliverables

* Secure routing
* RLS policies
* Storage policies
* Server-only service role usage

### Done When

* Employees cannot access admin-only data.
* Employees cannot modify other users’ bookings.
* Admins can manage required data.
* Secrets are not exposed in client code.

---

## Phase 15: Testing and Quality Assurance

### Goal

Verify that the system works correctly before deployment.

### Testing Areas

1. Authentication
2. Role access
3. Booking creation
4. Conflict prevention
5. Approval workflow
6. Cancellation workflow
7. Facility management
8. Blocked periods
9. Maintenance closures
10. Email notification records
11. Reports
12. CSV exports
13. Audit logs
14. Settings
15. Production build

### Manual Test Scenarios

#### Scenario 1: Employee creates booking

1. Log in as employee.
2. Open facility list.
3. Select facility.
4. Choose date and time.
5. Submit booking.
6. Confirm booking is created.
7. Confirm status is correct.
8. Confirm booking appears in My Bookings.

#### Scenario 2: Conflict prevention

1. Create booking for Meeting Room 1, Level 5, from 10:00 to 11:00.
2. Attempt another booking for same facility from 10:30 to 11:30.
3. Confirm system rejects the second booking.

#### Scenario 3: Admin approval

1. Enable approval mode.
2. Employee creates booking.
3. Confirm status is Pending.
4. Admin approves booking.
5. Confirm status becomes Confirmed.

#### Scenario 4: Maintenance closure

1. Admin creates maintenance closure for a facility.
2. Employee attempts booking during closure.
3. Confirm booking is blocked.

#### Scenario 5: Report export

1. Admin opens reports.
2. Applies date filter.
3. Exports CSV.
4. Confirms CSV contains expected data.

### Deliverables

* Manual test checklist
* Fixed critical bugs
* Successful production build

### Done When

The app passes the core manual test scenarios and builds successfully.

---

## Phase 16: Deployment

### Goal

Deploy the application to Vercel with Supabase integration. Use the Vercel URL for current MVP testing; connect a custom domain later when ready.

### Tasks

1. Prepare production Supabase project.
2. Apply production database migrations.
3. Add production environment variables to Vercel.
4. Configure Vercel build command.
5. Keep Vercel output settings at the framework default.
6. Deploy preview.
7. Test authentication in preview.
8. Test booking flow in preview.
9. Connect custom domain later when ready.
10. Configure DNS through Vercel or the chosen DNS provider.
11. Enable HTTPS.
12. Test production deployment.
13. Create initial admin user.
14. Seed default facilities.
15. Verify internal-only access.

### Deliverables

* Deployed app
* Supabase production database
* Custom domain configured
* Initial admin account
* Seeded facilities

### Done When

The system is accessible on the custom domain and core booking workflows work in production.

---

## 7. Suggested Implementation Order

Codex should implement the system in this order:

1. Project setup
2. Supabase connection
3. Auth pages
4. Profile and role system
5. Database schema
6. Facility seed data
7. Facility list and detail pages
8. Booking creation
9. Booking conflict prevention
10. My Bookings page
11. Admin dashboard
12. Admin booking management
13. Facility admin management
14. Approval workflow
15. Blocked periods
16. Maintenance closures
17. Email notification records
18. Email sending provider
19. Reports
20. CSV export
21. Audit logs
22. System settings
23. RLS hardening
24. Final testing
25. Deployment

---

## 8. MVP Definition

The MVP should include enough functionality for real internal use.

### MVP Must Include

1. Email/password login.
2. Employee role.
3. Admin role.
4. Protected routes.
5. Facility list.
6. Facility detail page.
7. Five default facilities.
8. Booking creation.
9. Strict conflict prevention.
10. My Bookings page.
11. Booking cancellation.
12. Admin bookings page.
13. Admin facility management.
14. Approval mode configuration.
15. Basic approval workflow.
16. Blocked periods.
17. Maintenance closures.
18. Basic email notifications.
19. Booking history.
20. Basic audit logs.
21. CSV booking export.
22. Vercel deployment.

### MVP Can Defer

1. PDF export.
2. Excel export.
3. Recurring bookings.
4. Calendar integrations.
5. SSO.
6. Vercel protection, Cloudflare Access, or another internal access gate.
7. Advanced analytics.
8. QR check-in.
9. Native mobile app.
10. Multi-building support.

---

## 9. Key Technical Decisions

### 9.1 Booking Conflict Prevention

Conflict prevention must happen in the database, not only in the UI.

Recommended approach:

* Use PostgreSQL range types or exclusion constraints where practical.
* Use a transaction-safe server-side booking creation function.
* Only active statuses should block time slots:

  * `pending`
  * `confirmed`

The app should also run a frontend/server availability check before attempting insert, but the final protection must be database-level.

### 9.2 Timezone Handling

Store all timestamps in UTC.

Display times in the configured local timezone.

Default timezone:

```txt
Asia/Kuala_Lumpur
```

### 9.3 Role-Based Access

Use Supabase Auth for authentication.

Use a `profiles` table for application-level role and status.

Do not rely only on frontend UI hiding.

Admin privileges must be checked server-side.

### 9.4 Email Notifications

Booking actions should create email notification records.

Email sending can be immediate or queue-based.

Recommended approach:

1. Booking action happens.
2. Email notification record is created.
3. Email sending service sends the email.
4. Record is marked as sent or failed.

This makes failures visible and retryable.

### 9.5 Facility Photos

Use Supabase Storage.

Recommended bucket:

```txt
facility-photos
```

Photos should be linked in the `facility_photos` table.

---

## 10. Risks and Mitigations

### Risk 1: Double Booking

Potential issue:

Two users submit bookings at the same time.

Mitigation:

* Database-level conflict prevention.
* Transaction-safe insert logic.
* Clear error message when conflict occurs.

### Risk 2: Weak Authorization

Potential issue:

Employees access admin data or another user’s bookings.

Mitigation:

* Route protection.
* Server-side role checks.
* Supabase RLS policies.

### Risk 3: Email Provider Changes

Potential issue:

Email provider is not finalized.

Mitigation:

* Abstract email provider behind internal service.
* Store provider secrets in environment variables.
* Avoid provider-specific logic throughout the app.

### Risk 4: Vercel Deployment Configuration

Potential issue:

Some Next.js server features may require configuration.

Mitigation:

* Confirm Vercel build and runtime configuration early.
* Avoid static export because the app depends on server actions and route handlers.
* Test deployment before the project is complete.
* Avoid Node-only APIs where possible.

### Risk 5: Report Performance

Potential issue:

Reports can become slow as data grows.

Mitigation:

* Add indexes.
* Paginate results.
* Filter by date range.
* Use summary queries where practical.

### Risk 6: Storage Permissions

Potential issue:

Facility photos may be exposed incorrectly.

Mitigation:

* Configure Supabase Storage policies.
* Use public bucket only if facility photos are not sensitive.
* Otherwise use signed URLs.

---

## 11. Configuration Strategy

System behavior should be configurable through the database where practical.

### Database-Driven Settings

Examples:

* Registration enabled
* Allowed email domains
* Default approval mode
* Per-facility approval override
* Reminder timing
* App name
* Company name
* System contact email

### Environment-Driven Settings

Examples:

* Supabase URL
* Supabase anon key
* Supabase service role key
* Email provider API key
* Email sender address
* App URL
* App timezone

Sensitive settings must not be stored in normal database tables.

---

## 12. Suggested Milestones

### Milestone 1: App Foundation

Includes:

* Next.js setup
* Supabase setup
* Auth
* Profiles
* Roles
* Protected routes

### Milestone 2: Booking Foundation

Includes:

* Facilities
* Booking form
* Availability checking
* Conflict prevention
* My Bookings

### Milestone 3: Admin Operations

Includes:

* Admin dashboard
* Facility management
* Booking management
* Approval workflow
* Blocked periods
* Maintenance closures

### Milestone 4: Notifications and Reporting

Includes:

* Email notification system
* Reports
* CSV exports
* Audit logs

### Milestone 5: Production Deployment

Includes:

* Security hardening
* RLS review
* Testing
* Vercel deployment
* Custom domain setup

---

## 13. Recommended Codex Workflow

Use Codex in small controlled steps.

Start each Codex session with:

```txt
Read docs/REQUIREMENTS.md, docs/DEVELOPMENT_PLAN.md, docs/DATABASE_SCHEMA.md, docs/USER_FLOWS.md, docs/CODEX_TASKS.md, and docs/DEPLOYMENT_NOTES.md before making changes.

Follow docs/CODEX_TASKS.md in order.

Implement only the current task unless instructed otherwise.

After completing a task, summarize:
1. Files changed
2. What was implemented
3. Any assumptions
4. Any commands to run
5. Any next recommended task
```

Codex should not implement multiple major phases at once unless explicitly instructed.

---

## 14. Required Quality Checks

Before considering a phase complete, run:

```bash
npm run lint
npm run build
```

If tests are added later, also run:

```bash
npm test
```

Codex should fix TypeScript, linting, and build errors before moving to the next task.

---

## 15. Development Completion Criteria

The development plan is complete when:

1. The app is deployed to Vercel.
2. The app is accessible through the Vercel URL, with custom domain setup available later.
3. Email/password authentication works.
4. Employees can book facilities.
5. The system prevents overlapping bookings.
6. Employees can view and cancel their own bookings.
7. Admins can manage users.
8. Admins can manage facilities.
9. Admins can manage all bookings.
10. Admins can approve or reject bookings when approval is enabled.
11. Admins can create blocked dates.
12. Admins can create maintenance closures.
13. Required email notifications are sent or queued.
14. Admins can view booking history.
15. Admins can view reports.
16. Admins can export CSV reports.
17. Audit logs are created for key actions.
18. Internal-only access is enforced.
19. Production environment variables are configured.
20. The production build passes.

```
```
