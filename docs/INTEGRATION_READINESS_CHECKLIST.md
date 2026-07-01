# Integration Readiness Checklist

This checklist verifies app-side readiness for SMTP email and Microsoft 365 Calendar integration. It does not contain real secrets.

## Current Safe Values While Waiting For Credentials

Use these values while Microsoft 365 mailbox and Microsoft Entra setup are not ready:

```txt
EMAIL_PROVIDER=none
MICROSOFT_365_CALENDAR_SYNC_ENABLED=false
MICROSOFT_SYNC_MODE=disabled
CALENDAR_SYNC_PROVIDER=disabled
N8N_CALENDAR_SYNC_ENABLED=false
```

Blank `EMAIL_PROVIDER` is also supported and behaves like `none`.

## SMTP Email Readiness

| Item | Status | Notes |
| --- | --- | --- |
| App code support complete | Ready | `EMAIL_PROVIDER=smtp` routes through the SMTP provider. |
| Env template complete | Ready | `docs/vercel-env-templates/booking-system-vercel-env.example` includes SMTP placeholders and server-only `CRON_SECRET`. |
| Vercel env imported | Ready for manual values | Import/paste values in Vercel, including `CRON_SECRET`, then redeploy. |
| Disabled mode verified | Ready | Blank/`none` provider fails safely with a clear configuration message. |
| Provider options | Ready | Blank/`none`, `resend`, and `smtp` are supported. |
| SMTP env names | Ready | `EMAIL_PROVIDER`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`. |
| Queue processing automation | Ready | `/api/cron/email/process` processes queued rows every 5 minutes when called with `Authorization: Bearer ${CRON_SECRET}`. |
| Reminder queueing automation | Ready | `/api/cron/email/reminders` queues due reminders every 15 minutes and does not send directly. |
| Microsoft 365 SMTP defaults | Ready | Host `smtp.office365.com`, port `587`, secure `false`, require TLS `true`. |
| External requirement: Microsoft 365 mailbox | Pending IT | Prefer a dedicated service mailbox such as `noreply@yourcompany.com`. |
| External requirement: SMTP AUTH | Pending IT | SMTP AUTH may need to be enabled for the mailbox. |
| External requirement: SMTP credentials | Pending IT | Add mailbox password or app password only in Vercel/local private env files. |
| Manual fallback test: process queued email | Pending credentials | Queue a booking/invitation email and process from `/admin/email-notifications`. |

### SMTP Verification Steps

1. Set Vercel SMTP env vars and server-only `CRON_SECRET`.
2. Redeploy the app.
3. Create a queued booking or invitation notification.
4. Confirm `/api/cron/email/process` rejects missing or invalid authorization.
5. Confirm `/api/cron/email/process` with `Authorization: Bearer ${CRON_SECRET}` processes queued rows.
6. Optionally open `/admin/email-notifications` as Admin or Super Admin and click `Process queued emails` to verify the manual fallback.
7. Confirm provider shows `SMTP`.
8. Confirm status changes to `sent`.
9. If failed, review `last_error`.
10. Confirm no secrets appear in the UI, cron response, or log output.

## Microsoft 365 Calendar Readiness

| Item | Status | Notes |
| --- | --- | --- |
| App code support complete | Ready | Outbound one-way sync code exists for confirmed and cancelled bookings. |
| Env template complete | Ready | Template includes Microsoft 365 Calendar placeholders. |
| Disabled mode safe | Ready | `MICROSOFT_365_CALENDAR_SYNC_ENABLED=false` and `MICROSOFT_SYNC_MODE=disabled` avoid Graph calls. |
| Config validation | Ready | Required vars are checked only when sync is enabled. |
| Super Admin page exists | Ready | `/admin/integrations/microsoft-calendar`. |
| Migration 0014 exists | Ready locally | `supabase/migrations/0014_microsoft_calendar_sync_groundwork.sql`. |
| Secret handling | Ready | Client secret and tokens are server-only and sanitized from errors. |
| External requirement: Entra app | Pending IT | Create Microsoft Entra app registration. |
| External requirement: Graph permission | Pending IT | Grant `Calendars.ReadWrite` application permission or IT-approved equivalent. |
| External requirement: admin consent | Pending IT | Tenant admin consent is required for application permissions. |
| External requirement: calendar target | Pending IT | Use `MICROSOFT_DEFAULT_CALENDAR_ID` for `central_calendar`, or `MICROSOFT_SYNC_MODE=booking_owner_calendar` with configured allowed company domains. |
| External requirement: mailbox access scope | Pending IT | For booking-owner mode, constrain app-only Graph access to staff mailboxes with an Exchange Application Access Policy or mail-enabled security group. |
| External requirement: env credentials | Pending IT/deployment | Tenant ID, client ID, client secret, and central calendar ID only when using `central_calendar`. |
| Manual test: confirmed booking creates event | Pending credentials | Enable sync and create/approve a confirmed booking. |
| Manual test: cancelled booking removes event | Pending credentials | Cancel a synced confirmed booking. |
| Manual test: retry failed sync | Pending credentials | Retry from the Super Admin integration page. |
| n8n lifecycle provider | Ready for webhook values | `CALENDAR_SYNC_PROVIDER=n8n_webhook` calls create, update, and delete webhooks when the matching URLs are configured. |
| n8n create-only mode | Supported | Blank update/delete webhook URLs keep the provider in create-only mode for safe testing. |

### Microsoft 365 Calendar Verification Steps

1. Apply migrations `0014` and `0021` before enabling real sync.
2. Set Microsoft Entra env vars in Vercel, plus `MICROSOFT_DEFAULT_CALENDAR_ID` for central mode.
3. Redeploy the app.
4. Enable sync with `MICROSOFT_365_CALENDAR_SYNC_ENABLED=true` and either `MICROSOFT_SYNC_MODE=central_calendar` or `MICROSOFT_SYNC_MODE=booking_owner_calendar`.
5. Create or approve a confirmed booking.
6. Confirm the Outlook event appears in the configured central calendar or the booking owner's company mailbox.
7. Cancel the synced booking.
8. Confirm the Outlook event is removed and the sync record is `cancelled`.
9. Force a failed sync in a controlled test and retry from `/admin/integrations/microsoft-calendar`.

### n8n Webhook Verification Steps

1. Set `CALENDAR_SYNC_PROVIDER=n8n_webhook` and `N8N_CALENDAR_SYNC_ENABLED=true`.
2. Set `N8N_CALENDAR_CREATE_WEBHOOK_URL`, `N8N_CALENDAR_UPDATE_WEBHOOK_URL`, `N8N_CALENDAR_DELETE_WEBHOOK_URL`, and `N8N_CALENDAR_WEBHOOK_SECRET` in Vercel or a private local env file.
3. Redeploy or restart the app.
4. Create or approve a confirmed booking.
5. Confirm n8n receives the create payload and creates the Outlook event.
6. Reschedule/update the confirmed booking and confirm n8n receives the update payload.
7. Cancel the synced booking and confirm n8n receives the delete payload.
8. Confirm `/admin/integrations/microsoft-calendar` shows provider `n8n webhook`, lifecycle mode, and the create/update/delete webhook configured yes/no state without displaying URLs or secrets.
9. Confirm the sync record uses provider `n8n_webhook` and status `synced` after create/update, then `cancelled` after delete.
10. If a sync record reports a non-JSON response, confirm Vercel uses the production `/webhook/` URL, the workflow is active, and the stored error includes status/content-type/safe body preview without exposing the webhook secret.
11. If the error says `Status: 403 Forbidden` with `<title>Just a moment...</title>`, ask IT to bypass Cloudflare challenge/security only for `n.qsbportal.com.my/webhook/booking-calendar/*`; the webhook remains protected by `x-booking-system-secret`.

## What Remains Outside The Developer/User Account

SMTP:

- Microsoft 365 service mailbox.
- SMTP AUTH enabled for that mailbox.
- Mailbox password or app password.
- Verified `EMAIL_FROM` identity.
- Vercel Production env values and redeploy.

Microsoft 365 Calendar:

- Microsoft Entra app registration.
- Microsoft Graph `Calendars.ReadWrite` application permission or IT-approved equivalent.
- Tenant admin consent.
- Central booking calendar mailbox or calendar target.
- Tenant ID, client ID, client secret, and calendar mailbox/user principal name.
- Migration `0014` applied to the target Supabase project.
- Manual Graph sync QA before production enablement.

n8n calendar mode:

- n8n create workflow URL.
- n8n update workflow URL for full lifecycle mode.
- n8n delete workflow URL for full lifecycle mode.
- Shared webhook secret.
- Cloudflare path bypass or webhook-only subdomain if Vercel receives a Cloudflare challenge page.
- Migration `0021` applied to allow provider `n8n_webhook` in sync records.

## Safety Notes

- Do not commit `.env.local` or `.env.vercel.local`.
- Do not commit SMTP passwords, Supabase service role keys, Microsoft client secrets, or access tokens.
- Microsoft 365 SMTP, Microsoft Graph Calendar sync, and temporary n8n calendar webhook sync are separate integrations.
- Do not commit n8n webhook URLs or `N8N_CALENDAR_WEBHOOK_SECRET`.
- Supabase Auth emails are separate from the app email notification queue.
