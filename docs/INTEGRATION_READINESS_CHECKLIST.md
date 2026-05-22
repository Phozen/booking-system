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
| Env template complete | Ready | `docs/vercel-env-templates/booking-system-vercel-env.example` includes SMTP placeholders only. |
| Vercel env imported | Ready for manual values | Import/paste values in Vercel, then redeploy. |
| Disabled mode verified | Ready | Blank/`none` provider fails safely with a clear configuration message. |
| Provider options | Ready | Blank/`none`, `resend`, and `smtp` are supported. |
| SMTP env names | Ready | `EMAIL_PROVIDER`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`. |
| Microsoft 365 SMTP defaults | Ready | Host `smtp.office365.com`, port `587`, secure `false`, require TLS `true`. |
| External requirement: Microsoft 365 mailbox | Pending IT | Prefer a dedicated service mailbox such as `noreply@yourcompany.com`. |
| External requirement: SMTP AUTH | Pending IT | SMTP AUTH may need to be enabled for the mailbox. |
| External requirement: SMTP credentials | Pending IT | Add mailbox password or app password only in Vercel/local private env files. |
| Manual test: process queued email | Pending credentials | Queue a booking/invitation email and process from `/admin/email-notifications`. |

### SMTP Verification Steps

1. Set Vercel SMTP env vars.
2. Redeploy the app.
3. Create a queued booking or invitation notification.
4. Open `/admin/email-notifications` as Admin or Super Admin.
5. Click `Process queued emails`.
6. Confirm provider shows `SMTP`.
7. Confirm status changes to `sent`.
8. If failed, review `last_error`.
9. Confirm no secrets appear in the UI or log output.

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
| External requirement: central calendar mailbox | Pending IT | `MICROSOFT_DEFAULT_CALENDAR_ID` should be the central booking calendar mailbox user ID or UPN. |
| External requirement: env credentials | Pending IT/deployment | Tenant ID, client ID, client secret, default calendar ID. |
| Manual test: confirmed booking creates event | Pending credentials | Enable sync and create/approve a confirmed booking. |
| Manual test: cancelled booking removes event | Pending credentials | Cancel a synced confirmed booking. |
| Manual test: retry failed sync | Pending credentials | Retry from the Super Admin integration page. |
| Temporary n8n create provider | Ready for webhook values | `CALENDAR_SYNC_PROVIDER=n8n_webhook` calls only the n8n create webhook for confirmed bookings. |
| n8n update/delete | Deferred | Update/delete webhook env placeholders exist, but update/delete sync is skipped safely in create-only test mode. |

### Microsoft 365 Calendar Verification Steps

1. Apply migrations `0014` and `0021` before enabling real sync.
2. Set Microsoft Entra and central calendar env vars in Vercel.
3. Redeploy the app.
4. Enable sync with `MICROSOFT_365_CALENDAR_SYNC_ENABLED=true` and `MICROSOFT_SYNC_MODE=central_calendar`.
5. Create or approve a confirmed booking.
6. Confirm the Outlook event appears in the central booking calendar.
7. Cancel the synced booking.
8. Confirm the Outlook event is removed and the sync record is `cancelled`.
9. Force a failed sync in a controlled test and retry from `/admin/integrations/microsoft-calendar`.

### Temporary n8n Create Webhook Verification Steps

1. Set `CALENDAR_SYNC_PROVIDER=n8n_webhook` and `N8N_CALENDAR_SYNC_ENABLED=true`.
2. Set `N8N_CALENDAR_CREATE_WEBHOOK_URL` and `N8N_CALENDAR_WEBHOOK_SECRET` in Vercel or a private local env file.
3. Redeploy or restart the app.
4. Create or approve a confirmed booking.
5. Confirm n8n receives the create payload and creates the Outlook event.
6. Confirm `/admin/integrations/microsoft-calendar` shows provider `n8n webhook` and the create/update/delete webhook configured yes/no state without displaying URLs or secrets.
7. Confirm the sync record uses provider `n8n_webhook` and status `synced`.
8. Confirm cancellation/reschedule does not call Microsoft Graph fallback in n8n mode; update/delete remain deferred until those workflows exist.
9. If a sync record reports a non-JSON response, confirm Vercel uses the production `/webhook/` URL, the workflow is active, and the stored error includes status/content-type/safe body preview without exposing the webhook secret.

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

n8n calendar test mode:

- n8n create workflow URL.
- Shared webhook secret.
- Migration `0021` applied to allow provider `n8n_webhook` in sync records.
- Update/delete n8n workflows before full cancellation/reschedule sync is enabled.

## Safety Notes

- Do not commit `.env.local` or `.env.vercel.local`.
- Do not commit SMTP passwords, Supabase service role keys, Microsoft client secrets, or access tokens.
- Microsoft 365 SMTP, Microsoft Graph Calendar sync, and temporary n8n calendar webhook sync are separate integrations.
- Do not commit n8n webhook URLs or `N8N_CALENDAR_WEBHOOK_SECRET`.
- Supabase Auth emails are separate from the app email notification queue.
