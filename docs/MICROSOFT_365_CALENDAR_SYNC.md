# Microsoft 365 Calendar Sync

This document defines the planned Microsoft 365 Calendar integration for the Booking System.

Stage 2 implements outbound Microsoft Graph sync. The app does not import Microsoft 365 calendar events, run delegated user OAuth, sync personal organizer calendars, create Teams meetings, or perform two-way sync.

## Overview

The intended sync direction is one-way:

```txt
Booking System -> Microsoft 365 Calendar
```

When sync is enabled and configured, the app creates or updates a Microsoft 365 calendar event when a booking becomes confirmed, and deletes the event when the synced booking is cancelled. Microsoft 365 events are not imported back into the Booking System in v1.

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

Sync is a side effect after booking state changes. Microsoft Graph failures do not roll back booking creation, approval, or cancellation. Failures are recorded in `booking_calendar_syncs` for Super Admin review and retry.

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

Add these values in `.env.local` for local testing and in Vercel Project Settings for production:

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

`MICROSOFT_DEFAULT_CALENDAR_ID` is treated as the central booking calendar mailbox user ID or user principal name. The v1 Graph path is:

```txt
/users/{MICROSOFT_DEFAULT_CALENDAR_ID}/events
```

For example:

```txt
MICROSOFT_DEFAULT_CALENDAR_ID=booking-calendar@company.com
```

## Database Sync Tracking

Migration `0014_microsoft_calendar_sync_groundwork.sql` adds `public.booking_calendar_syncs`.

Purpose:

- Track outbound Microsoft 365 sync state per booking.
- Store external calendar/event IDs after Stage 2.
- Store sanitized errors and retry attempts.
- Support future Super Admin retry/status workflows.

The table records Microsoft Graph sync state. Migration `0014` must be applied before enabled sync can record successful or failed attempts:

```powershell
npx.cmd supabase db push
```

Employees do not directly access sync records. Admins and Super Admins can view sync state. Super Admins can manage records for future retry/repair tooling.

## Security Considerations

- Microsoft client secret must stay server-only.
- Microsoft Graph tokens must never be exposed to client components.
- Do not store access tokens in browser storage.
- Store only sanitized sync errors.
- Do not store raw stack traces, secrets, or bearer tokens in `last_error`.
- Integration status and retry UI is Super Admin only at `/admin/integrations/microsoft-calendar`.
- Employees should not see raw sync records or integration internals.
- Event body content should avoid sensitive admin-only booking details.

## Runtime Behavior

Confirmed booking paths:

- Booking created as confirmed automatically: create Microsoft 365 event.
- Pending booking approved by Admin/Super Admin: create Microsoft 365 event.
- Existing confirmed booking retried by Super Admin: create or update Microsoft 365 event.

Cancelled booking paths:

- Employee cancels their own confirmed booking: delete Microsoft 365 event if one exists.
- Admin/Super Admin cancels a confirmed booking: delete Microsoft 365 event if one exists.
- Super Admin retries a cancelled booking: delete Microsoft 365 event if one exists.

Skipped paths:

- Pending bookings are not synced.
- Rejected bookings are not synced.
- Completed/expired bookings keep historical Microsoft 365 events.
- Sync disabled or `MICROSOFT_SYNC_MODE=disabled` performs no Graph calls.

## Super Admin Status And Retry

Route:

```txt
/admin/integrations/microsoft-calendar
```

The page shows:

- Enabled/disabled state.
- Sync mode.
- Whether required env configuration is present.
- Default calendar target.
- Recent sync records.
- Attempts and sanitized errors.
- Retry action for records with a related booking.

The page does not show client secrets, access tokens, or raw Microsoft responses.

## Manual IT Setup Checklist

- [ ] Choose central calendar mailbox for v1, or confirm room-calendar strategy.
- [ ] Create or identify the Microsoft 365 calendar/mailbox.
- [ ] Create Microsoft Entra app registration.
- [ ] Grant the required Microsoft Graph calendar permissions.
- [ ] Provide tenant ID, client ID, client secret, and calendar ID to the deployment owner.
- [ ] Add Microsoft env vars in Vercel as server-side variables.
- [ ] Apply database migration `0014_microsoft_calendar_sync_groundwork.sql`.
- [ ] Keep sync disabled until Stage 2 code is deployed and verified.

## Implementation Notes

The implementation includes:

- Microsoft identity client credentials token request.
- Microsoft Graph fetch wrapper.
- Confirmed-booking event create/update.
- Cancelled-booking event delete.
- Configured timezone event mapping.
- Sanitized error storage.
- Super Admin retry/status page.

The token endpoint is:

```txt
https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
```

The app uses scope:

```txt
https://graph.microsoft.com/.default
```

## Manual QA

1. Disabled sync:
   - Set `MICROSOFT_365_CALENDAR_SYNC_ENABLED=false`.
   - Create or approve a booking.
   - Confirm booking succeeds and no Graph call is required.
2. Missing config:
   - Set `MICROSOFT_365_CALENDAR_SYNC_ENABLED=true` and `MICROSOFT_SYNC_MODE=central_calendar`.
   - Leave one required Microsoft variable blank.
   - Confirm booking succeeds and sync record shows a safe configuration error.
3. Confirmed booking sync:
   - Configure real Microsoft Entra values and a central booking calendar mailbox.
   - Create a confirmed booking.
   - Confirm Outlook event appears and sync record is `synced`.
4. Approval sync:
   - Create a pending booking.
   - Approve it.
   - Confirm Outlook event appears.
5. Cancellation sync:
   - Cancel a synced confirmed booking.
   - Confirm Outlook event is removed and sync record is `cancelled`.
6. Retry:
   - Force a failed sync.
   - Open `/admin/integrations/microsoft-calendar` as Super Admin.
   - Retry and confirm status updates.

## Known Limitations

- No OAuth flow is implemented.
- Facility-to-calendar mapping is deferred.
- Inbound Microsoft 365 availability import is out of scope.
- Two-way sync is out of scope.
- Microsoft Teams meeting creation is out of scope.
