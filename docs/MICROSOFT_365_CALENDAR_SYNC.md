# Microsoft 365 Calendar Sync

This document defines the planned Microsoft 365 Calendar integration for the Booking System.

Stage 1 is planning and configuration groundwork only. The app does not call Microsoft Graph, request tokens, run OAuth, create events, update events, or cancel events yet.

## Overview

The intended sync direction is one-way:

```txt
Booking System -> Microsoft 365 Calendar
```

The first implementation should create or update a Microsoft 365 calendar event when a booking becomes confirmed, and cancel or delete that event when the booking is cancelled. Microsoft 365 events will not be imported back into the Booking System in v1.

## Recommended V1 Architecture

Recommended v1 target: central booking calendar mailbox.

Example:

```txt
booking-calendar@company.com
```

This keeps operations simple because the app writes confirmed bookings to one configured calendar through Microsoft Graph application permissions.

Facility or room resource calendars are the best long-term model if the company already maintains Microsoft 365 room calendars. That model can be added later by mapping facilities to external calendar IDs.

Organizer personal calendars are not recommended for v1 because they usually require delegated OAuth, user consent, and more complex permission handling.

## Sync Target Options

### Option 1: Central Booking Calendar Mailbox

All confirmed bookings sync to one shared Microsoft 365 calendar.

Benefits:

- Simplest setup.
- One mailbox/calendar to permission and monitor.
- Good operational visibility for early rollout.

Tradeoff:

- Does not place events directly on each room resource calendar.

### Option 2: Facility Or Room Resource Calendars

Each Booking System facility maps to a Microsoft 365 room/resource calendar.

Examples:

```txt
meeting-room-1-level-5@company.com
meeting-room-2-level-5@company.com
event-hall-level-1@company.com
```

Benefits:

- Best long-term fit if Microsoft 365 room calendars already exist.
- Outlook users can inspect each room calendar directly.

Tradeoff:

- Requires facility-to-calendar mapping and more IT setup.

### Option 3: Organizer Calendar

Events sync to the booking owner's personal calendar.

This is not recommended for v1. It usually needs delegated permissions, OAuth, and user-level token management.

## Sync Behavior By Booking Status

| Booking status | Planned Microsoft 365 behavior |
| --- | --- |
| Pending | Do not sync yet |
| Confirmed | Create or update Microsoft 365 event |
| Rejected | Do not sync |
| Cancelled | Cancel or delete the synced event |
| Completed | Keep event as historical record |
| Expired | Keep event as historical record |

Stage 2 should hook into booking status transitions without changing booking conflict prevention, approval logic, or cancellation rules.

## Planned Event Content

Subject:

- Booking title or purpose.
- Facility name.

Location:

- Facility name.
- Facility level.

Start and end:

- Booking `starts_at` and `ends_at`.
- Store/query in UTC as the app already does.
- Display and event timezone handling should use the configured app timezone, falling back to `Asia/Kuala_Lumpur`.

Body:

- Booking purpose.
- Facility name and level.
- Organizer name/email.
- Safe attendee or invitation summary if enabled.
- Link back to the Booking System booking detail page.

Do not include admin-only approval internals, private cancellation reasons, raw audit metadata, secrets, or raw provider errors.

## Attendee Strategy

V1 should keep attendees minimal unless the company explicitly wants Outlook invitations to be sent from Microsoft 365.

Options:

- No attendees; event appears only on the central/facility calendar.
- Booking owner as attendee.
- Accepted invitees as attendees.
- All invited users as attendees.

Recommended v1 default: sync the event to the central calendar without attendees, and include organizer/invitation context in the event body only. This avoids surprising users with duplicate Outlook invitations while the Booking System invitation flow remains the source of truth.

## Microsoft Entra App Registration Checklist

An IT administrator should prepare:

- Microsoft Entra ID app registration.
- Tenant ID.
- Client ID.
- Client secret.
- Microsoft Graph permissions.
- Admin consent.
- A central booking calendar mailbox or target resource calendar.
- Confirmation that the app registration can write to the configured calendar.

## Permission Model Options

### Application Permissions

The app acts as itself rather than as an individual user.

Recommended for v1 because:

- It works well for server-side automation.
- No per-user OAuth flow is required.
- It can target a central booking mailbox or room calendars.

This requires tenant admin consent and should be scoped as narrowly as IT policy allows.

### Delegated Permissions

The app acts on behalf of a signed-in Microsoft user.

This is not recommended for v1 because it requires OAuth, user consent, token refresh handling, and more complex failure modes.

## Environment Variables

Add these values in `.env.local` for local testing and in Vercel Project Settings for production when Stage 2 is ready:

```txt
MICROSOFT_365_CALENDAR_SYNC_ENABLED=false
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_DEFAULT_CALENDAR_ID=
MICROSOFT_SYNC_MODE=disabled
MICROSOFT_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0
```

Supported sync modes:

- `disabled`
- `central_calendar`
- `facility_calendars`

Keep `MICROSOFT_CLIENT_SECRET` server-only. Never prefix Microsoft secrets with `NEXT_PUBLIC_`.

## Database Sync Tracking

Migration `0014_microsoft_calendar_sync_groundwork.sql` adds `public.booking_calendar_syncs`.

Purpose:

- Track outbound Microsoft 365 sync state per booking.
- Store external calendar/event IDs after Stage 2.
- Store sanitized errors and retry attempts.
- Support future Super Admin retry/status workflows.

The table does not create Microsoft Graph events by itself.

Employees do not directly access sync records. Admins and Super Admins can view sync state. Super Admins can manage records for future retry/repair tooling.

## Security Considerations

- Microsoft client secret must stay server-only.
- Microsoft Graph tokens must never be exposed to client components.
- Do not store access tokens in browser storage.
- Store only sanitized sync errors.
- Do not store raw stack traces, secrets, or bearer tokens in `last_error`.
- Future integration settings UI should be Super Admin only.
- Employees should not see raw sync records or integration internals.
- Event body content should avoid sensitive admin-only booking details.

## Manual IT Setup Checklist

- [ ] Choose central calendar mailbox for v1, or confirm room-calendar strategy.
- [ ] Create or identify the Microsoft 365 calendar/mailbox.
- [ ] Create Microsoft Entra app registration.
- [ ] Grant the required Microsoft Graph calendar permissions.
- [ ] Provide tenant ID, client ID, client secret, and calendar ID to the deployment owner.
- [ ] Add Microsoft env vars in Vercel as server-side variables.
- [ ] Apply database migration `0014_microsoft_calendar_sync_groundwork.sql`.
- [ ] Keep sync disabled until Stage 2 code is deployed and verified.

## Future Stage 2 Implementation Plan

Stage 2 should add:

- Microsoft Graph token client.
- Calendar event mapper.
- Confirmed-booking create/update behavior.
- Cancelled-booking cancel/delete behavior.
- Sanitized failure handling.
- Retry strategy.
- Admin or Super Admin sync-status visibility if needed.
- Tests with mocked Microsoft Graph responses.

## Known Limitations

- No Microsoft Graph calls are implemented in Stage 1.
- No OAuth flow is implemented.
- No real calendar event creation or cancellation exists yet.
- Facility-to-calendar mapping is deferred.
- Inbound Microsoft 365 availability import is out of scope.
- Two-way sync is out of scope.
