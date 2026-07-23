# Microsoft 365 Calendar Sync

This document defines the planned Microsoft 365 Calendar integration for the Booking System.

Stage 2 implements outbound Microsoft Graph sync. The `n8n_webhook` provider is also available for Outlook event lifecycle sync through n8n create, update, and delete workflows. The app does not import Microsoft 365 calendar events, create Teams meetings, or perform two-way sync.

## Overview

The intended sync direction is one-way:

```txt
Booking System -> Microsoft 365 Calendar
```

When sync is enabled and configured, the app creates or updates a Microsoft 365 calendar event when a booking becomes confirmed, and deletes the event when the synced booking is cancelled. Microsoft 365 events are not imported back into the Booking System in v1.

When `CALENDAR_SYNC_PROVIDER=n8n_webhook` and `N8N_CALENDAR_SYNC_ENABLED=true`, confirmed bookings call the configured n8n create webhook. If update/delete webhook URLs are configured, reschedules/updates and cancellations call the matching n8n workflows. If update/delete URLs are blank, the provider remains in create-only mode for safe testing.

## Recommended V1 Architecture

Recommended v1 targets: central booking calendar mailbox for shared operational visibility, or booking-owner mailboxes for company-only deployments where every staff account belongs to the same Microsoft 365 tenant.

Example:

```txt
booking-calendar@company.com
```

The central calendar keeps operations simple because the app writes confirmed bookings to one configured calendar through Microsoft Graph application permissions. Booking-owner mode writes each event to the booking owner's company mailbox while keeping the same one-way, server-side sync model.

Facility or room resource calendars are the best long-term model if the company already maintains Microsoft 365 room calendars. That model can be added later by mapping facilities to external calendar IDs.

Booking-owner mode supports two Microsoft Graph auth models:

- `MICROSOFT_GRAPH_AUTH_MODE=app_only` writes to `/users/{ownerEmail}/events` with application permissions and should be constrained by IT with an Exchange Application Access Policy or mail-enabled security group.
- `MICROSOFT_GRAPH_AUTH_MODE=delegated` writes to `/me/events` with the booking owner's connected Microsoft OAuth token. Each user must connect Microsoft Calendar from their profile.

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

Events sync to the booking owner's company mailbox calendar.

This is supported for company-only Microsoft 365 tenants through `MICROSOFT_SYNC_MODE=booking_owner_calendar`. Use `MICROSOFT_GRAPH_AUTH_MODE=app_only` for application permissions or `MICROSOFT_GRAPH_AUTH_MODE=delegated` for per-user delegated tokens.

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
- No per-user OAuth flow is required in app-only mode.
- It can target a central booking mailbox or room calendars.

This requires tenant admin consent and should be scoped as narrowly as IT policy allows.

### Delegated Permissions

The app acts on behalf of a signed-in Microsoft user.

Delegated booking-owner sync is available for company deployments that prefer user-consented calendar writes over application permissions. It requires OAuth consent, encrypted token storage, refresh handling, and a reconnect path when Microsoft revokes or expires refresh tokens.

## Environment Variables

Add these values in `.env.local` for local testing and in Vercel Project Settings for production:

```txt
CALENDAR_SYNC_PROVIDER=disabled
MICROSOFT_365_CALENDAR_SYNC_ENABLED=false
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_DEFAULT_CALENDAR_ID=
MICROSOFT_SYNC_MODE=disabled
MICROSOFT_GRAPH_AUTH_MODE=app_only
MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY=
MICROSOFT_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0

N8N_CALENDAR_SYNC_ENABLED=false
N8N_CALENDAR_CREATE_WEBHOOK_URL=
N8N_CALENDAR_UPDATE_WEBHOOK_URL=
N8N_CALENDAR_DELETE_WEBHOOK_URL=
N8N_CALENDAR_WEBHOOK_SECRET=
```

Supported provider values:

- `disabled`
- `microsoft_graph`
- `n8n_webhook`

Supported sync modes:

- `disabled`
- `central_calendar`
- `booking_owner_calendar`
- `facility_calendars`

Keep `MICROSOFT_CLIENT_SECRET` server-only. Never prefix Microsoft secrets with `NEXT_PUBLIC_`.

Keep `N8N_CALENDAR_WEBHOOK_SECRET` server-only. The Booking System sends it only in the `x-booking-system-secret` request header and never in the JSON payload. Do not show webhook URLs or secrets in the UI.

`MICROSOFT_DEFAULT_CALENDAR_ID` is required only for `central_calendar` mode and is treated as the central booking calendar mailbox user ID or user principal name. The central Graph path is:

```txt
/users/{MICROSOFT_DEFAULT_CALENDAR_ID}/events
```

For example:

```txt
MICROSOFT_DEFAULT_CALENDAR_ID=booking-calendar@company.com
```

In `booking_owner_calendar` mode, the app uses the booking owner's `profiles.email` as the Microsoft Graph user target:

```txt
/users/{bookingOwnerEmail}/events
```

The booking owner email must be valid and match `system_settings.allowed_email_domains`. If the domain allowlist is empty, or the email is missing, malformed, or outside the allowlist, the sync attempt is marked `skipped` with a safe reason. Existing synced events keep using the stored `booking_calendar_syncs.external_calendar_id` for update/delete, even if the profile email changes later.

## Database Sync Tracking

Migration `0014_microsoft_calendar_sync_groundwork.sql` adds `public.booking_calendar_syncs`. Migration `0025_microsoft_delegated_calendar_connections.sql` adds encrypted delegated Microsoft calendar connection storage.

Purpose:

- Track outbound Microsoft 365 sync state per booking.
- Store external calendar/event IDs after Stage 2.
- Store sanitized errors and retry attempts.
- Support future Super Admin retry/status workflows.

The sync table records Microsoft Graph and n8n webhook sync state. Migration `0014` must be applied before enabled sync can record successful or failed attempts. Migration `0021_n8n_calendar_webhook_provider.sql` must also be applied before n8n records can be stored because it expands the provider constraint. Migration `0025` must be applied before delegated Microsoft Calendar connections can be saved.

```powershell
npx.cmd supabase db push
```

Employees do not directly access sync records. Admins and Super Admins can view sync state. Super Admins can manage records for future retry/repair tooling.

## Security Considerations

- Microsoft client secret must stay server-only.
- Microsoft Graph tokens must never be exposed to client components.
- For booking-owner mode, Microsoft Graph application permissions should be limited by Exchange Application Access Policy or a mail-enabled security group covering only company staff mailboxes.
- Delegated provider tokens are stored only in `microsoft_calendar_connections` after server-side AES-256-GCM encryption with `MICROSOFT_DELEGATED_TOKEN_ENCRYPTION_KEY`.
- n8n webhook URLs and webhook secret must stay server-only.
- n8n webhook secret is sent as `x-booking-system-secret`, not in the JSON body.
- Do not store access tokens in browser storage.
- Store only sanitized sync errors.
- Do not store raw stack traces, secrets, or bearer tokens in `last_error`.
- Integration status and retry UI is Super Admin only at `/admin/integrations/microsoft-calendar`.
- Employees should not see raw sync records or integration internals.
- Event body content should avoid sensitive admin-only booking details.

## n8n Webhook Provider

Use this mode for Booking System -> n8n -> Outlook event sync. Create-only mode is supported when only the create webhook is configured. Full lifecycle mode is active when create, update, and delete webhook URLs are configured.

Required env:

```txt
CALENDAR_SYNC_PROVIDER=n8n_webhook
N8N_CALENDAR_SYNC_ENABLED=true
N8N_CALENDAR_CREATE_WEBHOOK_URL=https://your-n8n-host/webhook/...
N8N_CALENDAR_UPDATE_WEBHOOK_URL=https://your-n8n-host/webhook/...
N8N_CALENDAR_DELETE_WEBHOOK_URL=https://your-n8n-host/webhook/...
N8N_CALENDAR_WEBHOOK_SECRET=...
```

The create and update webhooks post JSON with safe booking fields: booking ID/reference, title, description, facility name/level/type, local start/end date-times, timezone, organizer name/email, attendee count, catering summary, and a Booking System admin link. Local date-times are formatted as `YYYY-MM-DDTHH:mm:ss` using the app timezone, commonly `Asia/Kuala_Lumpur`. Update payloads also include `externalEventId`.

Delete webhook payload:

```json
{
  "action": "delete",
  "bookingId": "...",
  "externalEventId": "..."
}
```

Expected n8n success response:

```json
{
  "success": true,
  "provider": "n8n_graph_delegated",
  "externalEventId": "event-id",
  "externalCalendarId": "me",
  "webLink": "https://..."
}
```

The app stores `externalEventId` in `booking_calendar_syncs` with provider `n8n_webhook` and status `synced`. Reschedule/update and cancellation paths do not call Microsoft Graph fallback in n8n mode. For update success, the app keeps or updates `externalEventId`, marks the sync record `synced`, clears `last_error`, and updates `last_synced_at`. For delete success, the app marks the sync record `cancelled`, clears `last_error`, and updates `last_synced_at`. Failures are sanitized and stored as `failed`; booking changes are not rolled back.

Troubleshooting HTML responses:

If the integration page reports an error like `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`, the webhook request reached something that returned HTML instead of compact JSON. Newer builds report the upstream status, content type, safe webhook host/path, and a short sanitized body preview instead of the raw parse error.

Check:

- Vercel `N8N_CALENDAR_CREATE_WEBHOOK_URL` uses the production `/webhook/` URL, not `/webhook-test/`.
- The n8n workflow is active/published.
- Vercel was redeployed after env var changes.
- `N8N_CALENDAR_WEBHOOK_SECRET` matches the n8n header check.
- The n8n workflow ends with a response body shaped like:

```json
{
  "success": true,
  "provider": "n8n_graph_delegated",
  "externalEventId": "...",
  "externalCalendarId": "me",
  "webLink": "https://outlook.office365.com/..."
}
```

- A manual PowerShell production webhook test returns JSON from the same URL configured in Vercel.

If the sanitized error includes `Status: 403 Forbidden`, `Content-Type: text/html`, and a body preview with `<title>Just a moment...</title>`, Cloudflare is challenging the Vercel server request before n8n receives it. This is an infrastructure rule issue, not a Booking System JSON or Microsoft Graph issue.

Practical fixes:

1. Add a Cloudflare skip/bypass rule for `Host = n.qsbportal.com.my` and URI path `/webhook/booking-calendar/*`. Skip managed challenge, WAF managed rules, bot challenge, and browser integrity checks only for that path. Keep the n8n `x-booking-system-secret` header check.
2. Use a dedicated webhook-only subdomain such as `hooks.qsbportal.com.my`, point it to n8n, and apply less aggressive Cloudflare security. Then update `N8N_CALENDAR_CREATE_WEBHOOK_URL`.
3. Set the webhook-only subdomain to DNS-only in Cloudflare if acceptable for the deployment.
4. Use n8n Cloud or another automation host that is not behind the blocking Cloudflare rule.
5. Consider a reverse polling design only if Cloudflare cannot be changed: n8n periodically asks the Booking System for pending sync jobs, creates the Outlook event, then calls back to mark the sync complete. This requires new secure API endpoints and is not the preferred quick fix.

Message to IT:

```txt
Please bypass Cloudflare challenge/security only for Host n.qsbportal.com.my and URI path /webhook/booking-calendar/*. The webhook remains protected by x-booking-system-secret header auth.
```

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
- Calendar target, shown as a central mailbox ID or booking-owner mailbox mode.
- Recent sync records.
- Attempts and sanitized errors.
- Retry action for records with a related booking.

The page does not show client secrets, access tokens, or raw Microsoft responses.

## Manual IT Setup Checklist

- [ ] Choose central calendar mailbox, booking-owner mailbox mode, or confirm room-calendar strategy.
- [ ] Create or identify the Microsoft 365 calendar/mailbox for central mode, or confirm all booking owner emails are company Microsoft 365 mailboxes.
- [ ] Create Microsoft Entra app registration.
- [ ] Grant the required Microsoft Graph calendar permissions.
- [ ] For booking-owner mode, constrain application access to company staff mailboxes with an Exchange Application Access Policy or mail-enabled security group.
- [ ] Provide tenant ID, client ID, client secret, and central calendar ID if using central mode to the deployment owner.
- [ ] Add Microsoft env vars in Vercel as server-side variables.
- [ ] Apply every migration in `supabase/migrations` to the target Supabase project.
- [ ] Keep sync disabled until Stage 2 code is deployed and verified.
- [ ] To test Microsoft login, enable the Azure provider in Supabase Auth, add `{NEXT_PUBLIC_APP_URL}/auth/callback` as an allowed Supabase redirect URL, and add the Supabase provider callback URL shown by Supabase as the Microsoft Entra redirect URI.

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
   - Configure real Microsoft Entra values and either a central booking calendar mailbox or `MICROSOFT_SYNC_MODE=booking_owner_calendar` with allowed email domains configured.
   - Create a confirmed booking.
   - Confirm Outlook event appears in the expected mailbox and sync record is `synced`.
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

- Delegated OAuth is implemented only for booking-owner Outlook calendar sync; inbound availability and two-way sync remain out of scope.
- Facility-to-calendar mapping is deferred.
- Inbound Microsoft 365 availability import is out of scope.
- Two-way sync is out of scope.
- Hybrid Teams meetings are supported only for direct Microsoft Graph delegated booking-owner calendar sync. A confirmed hybrid booking creates or updates one Outlook event with `isOnlineMeeting: true` and `onlineMeetingProvider: teamsForBusiness`; its existing internal QBook invitees are the Outlook attendees and the room remains the location. Pending requests do not create an event. The Teams join URL is not stored or displayed by QBook.
- Central-calendar mode, n8n-only mode, disabled sync, app-only owner sync, external guests, two-way sync, and turning Teams off after confirmation are out of scope. To change a confirmed meeting type, cancel and recreate it.

## Hybrid meeting prerequisites

- IT must grant delegated `Calendars.ReadWrite` consent for the Entra app and permit Teams meetings for the tenant/users.
- Set `CALENDAR_SYNC_PROVIDER=microsoft_graph`, `MICROSOFT_365_CALENDAR_SYNC_ENABLED=true`, `MICROSOFT_SYNC_MODE=booking_owner_calendar`, and `MICROSOFT_GRAPH_AUTH_MODE=delegated` with the server-only delegated-token encryption key.
- Each organiser must connect the same eligible company Microsoft account from their QBook profile. QBook records sanitized failures in `booking_calendar_syncs`; it never rolls back the valid room booking or claims an invitation was sent after a failure.
