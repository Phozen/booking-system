# Product Scope and Requirements

## Purpose

QBook is an internal system for booking company facilities with controlled employee access, database-enforced availability, operational administration, and traceable booking activity. This document reflects the current product scope; historical planning records remain in `docs/DEVELOPMENT_PLAN.md`.

## Access and roles

- The intended access model is Microsoft-backed, pre-provisioned internal users, not public self-registration.
- Protected pages/actions require an active application profile.
- Employees manage their own permitted booking/invitation/profile/preference work.
- Admins operate booking, facility, availability, email, report, and audit workflows.
- Super Admins manage allowlisted users, roles/statuses, non-secret settings, departments, and integration operations.
- The system must protect against self-disable and removal of the final active Super Admin.

## Booking requirements

- Users can book active facilities with a title, time range, attendee count, optional description, and optional catering details.
- A booking may include active involved departments and active internal invitees.
- The booking, department tags, and initial invitations must be created atomically.
- The backend/database must reject overlaps for the same facility in active states; client-side availability feedback is advisory only.
- Back-to-back booking ranges are allowed.
- Blocked periods, maintenance closures, facility status, approvals, ownership, capacity-related validation, and valid state transitions must be enforced.
- Employees can edit/reschedule or cancel only eligible own bookings; admins have operational authority subject to the same guarded transitions.
- Approvals can produce pending, confirmed, or rejected outcomes, with review/audit information.
- Check-in/no-show/usage information and printable booking forms support operations.

## Facility and availability requirements

- Admins can manage facilities, equipment, and private facility photos.
- Facility records are archived rather than destructively deleted when history must be retained.
- Active users can browse authorised facility information; photo management is an admin function.
- Admins can manage blocked periods, maintenance closures, and unified unavailability views.

## Communication and reporting requirements

- The application records notifications and can queue booking/invitation/reminder email.
- Email delivery must support deliberately configured Resend or SMTP providers and fail safely when unconfigured.
- Super/Admin users can view email queue state and conduct approved retries/processing.
- The system provides operational reports and CSV exports for booking history, utilisation, users, cancellations, and audit data.
- Important operations must produce audit information where implemented.

## Optional integrations

- One-way outbound Microsoft Graph or n8n calendar sync is supported for configured booking lifecycle events.
- Sync failure must not corrupt or reverse a valid local booking; errors are tracked separately.
- Two-way/inbound calendar sync, Teams meeting creation, facility-to-calendar mapping, and recurring booking operations are outside the current scope.

## Non-functional requirements

- Supabase RLS, server validation, and database constraints must protect data beyond the UI.
- Secrets must be server-only and excluded from source control.
- Schema changes must be append-only migrations.
- The repository must support linting, type checking, automated tests, browser testing, dependency audit, and controlled release checks.
- Production readiness needs environment-specific evidence, not just successful local tests.

## Current exclusions

- Public registration and email/password product authentication.
- External guest invitations.
- New recurring booking creation or recurrence management.
- Inbound/two-way calendar synchronisation.
- External guests, recurring hybrid meetings, Teams recordings/transcripts, room-resource mapping, or storing/displaying raw Teams join URLs.

## Optional hybrid Teams meetings

- A staff requester may opt into a Teams-backed Outlook event for a physical-room booking. The option is off by default and uses the selected internal invitees only, never the attendee-count field.
- The event is created only after room confirmation in the requester’s connected Microsoft 365 calendar. Outlook owns the invitation and Join button; QBook remains the room-booking system of record.
- The option is unavailable unless direct Microsoft Graph delegated booking-owner sync is configured. The confirmed meeting type is immutable; changing it requires cancel-and-recreate.

See [Architecture](ARCHITECTURE.md), [User flows](USER_FLOWS.md), [Testing](TESTING.md), and [Deployment](DEPLOYMENT.md) for the implementation and operational details.
