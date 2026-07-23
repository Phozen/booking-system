# User Flows

This document describes the current implemented flows. It is a product/operational guide, not a substitute for database or authorisation checks.

## Roles

| Role | Main responsibilities |
| --- | --- |
| Employee | Book facilities, manage eligible own bookings, respond to invitations, and manage safe profile/preferences fields |
| Admin | Operate bookings, approvals, facilities, equipment, availability, email queue, reports, and audit views |
| Super Admin | Admin scope plus allowlist users/roles, settings, departments, and integration management |

## Authentication and access

1. A user opens `/login` and begins the approved Microsoft/Supabase flow.
2. The callback establishes a session only when identity/access requirements are satisfied.
3. The application checks the active profile/role before protected routes and sensitive server actions.
4. Employees cannot use admin routes. Admins cannot perform Super Admin-only user/settings operations.

`/register` and `/reset-password` are retained as routes but are not the public account-creation path for the intended Microsoft-only deployment.

## Employee booking flow

1. The employee opens `/bookings/new` from the dashboard or facility page.
2. They choose an active facility, date/time, title, description, and attendee count.
3. The form reports availability and validates input.
4. They may add catering details, active involved departments, and active internal invitees.
5. The server/database validates availability, booking authority, blocked periods, maintenance, approval requirement, department/invitee eligibility, and conflict constraints.
6. A successful transaction creates the booking, selected departments, and initial invitations. The status is pending or confirmed according to approval rules.
7. The user is directed to their booking detail and sees appropriate in-app/email notifications when configured.

Overlapping active bookings are rejected. A booking ending at the exact start time of the next booking is valid.

## Employee booking management

From `/my-bookings` and `/bookings/[id]`, an employee can view their relevant booking details, catering, departments, invitation information, print form, and eligible management actions. They can edit/reschedule or cancel only when the state and ownership rules permit it.

The employee can use:

- `/invitations` to accept or decline internal invitations;
- `/calendar` to view authorised booking/calendar data;
- `/notifications` and `/notification-preferences` for notification activity/preferences;
- `/profile` for safe self-service profile fields.

## Admin operations

Admins use `/admin/dashboard` for operational overview and can:

- review and manage bookings, including creating a booking for an active user;
- approve, reject, cancel, check in, or mark a no-show where the state allows it;
- manage facilities, photos, equipment, blocked periods, maintenance, and unified unavailability;
- process/retry the email queue and review email health;
- view and export reports, then inspect audit records.

Admin-created bookings support the same department and internal attendee concepts as employee-created bookings. All resulting data remains subject to database rules.

## Super Admin operations

Super Admins can perform admin work plus:

- maintain active departments at `/admin/departments`;
- manage pre-provisioned users and safe role/status changes at `/admin/users`;
- manage non-secret system settings at `/admin/settings`;
- review/retry configured calendar integrations at `/admin/integrations/microsoft-calendar`;
- inspect system health and privileged operational routes.

Safeguards prevent unsafe self-disable and final-active-Super-Admin removal flows.

## Notifications and integrations

Booking/invitation events can create application notification and email-queue records. Email delivery is optional; a missing provider configuration records a safe failure instead of exposing credentials.

Confirmed/cancelled booking changes can be synchronised one-way to a configured Microsoft Graph or n8n calendar provider. Sync errors are tracked separately and do not undo the local booking. Inbound/two-way calendar synchronisation and recurring booking operations are not current user flows.

## Operational flow boundaries

- Browser UI visibility is not the final authorisation decision; server actions, database functions, RLS, and policies enforce the rule.
- External-provider features require an authorised environment setup and UAT evidence before claiming they are live.
- Historical recurrence records remain accessible for audit but cannot be used to create/manage recurring series.
