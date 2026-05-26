import "server-only";

import { createAuditLogSafely } from "@/lib/audit/log";
import {
  getMicrosoftCalendarSyncConfig,
  getN8nCalendarSyncConfig,
} from "@/lib/integrations/microsoft-365-calendar/config";
import {
  buildMicrosoftGraphPath,
  microsoftGraphFetch,
} from "@/lib/integrations/microsoft-365-calendar/client";
import { sanitizeMicrosoftCalendarError } from "@/lib/integrations/microsoft-365-calendar/errors";
import {
  buildMicrosoftCalendarEventPayload,
  type MicrosoftCalendarBookingForEvent,
} from "@/lib/integrations/microsoft-365-calendar/event-mapper";
import {
  buildN8nCalendarCreatePayload,
  buildN8nCalendarDeletePayload,
  buildN8nCalendarUpdatePayload,
  sendN8nCalendarCreateWebhook,
  sendN8nCalendarDeleteWebhook,
  sendN8nCalendarUpdateWebhook,
  type N8nCalendarBookingForEvent,
} from "@/lib/integrations/microsoft-365-calendar/n8n-webhook";
import type {
  MicrosoftCalendarSyncResult,
  MicrosoftCalendarSyncStatus,
  MicrosoftGraphEventResponse,
} from "@/lib/integrations/microsoft-365-calendar/types";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";

type SyncRecord = {
  id: string;
  booking_id: string;
  provider: string;
  external_calendar_id: string | null;
  external_event_id: string | null;
  sync_status: MicrosoftCalendarSyncStatus;
  attempts: number;
  last_error: string | null;
};

type SyncActor = {
  userId?: string | null;
  email?: string | null;
  reason?: string;
};

type BookingRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  attendee_count: number | null;
  catering_required: boolean | null;
  catering_type: string | null;
  catering_pax: number | null;
  catering_serving_time: string | null;
  catering_dietary_notes: string | null;
  catering_notes: string | null;
  facilities:
    | {
        name: string;
        level: string;
        type: string | null;
      }
    | {
        name: string;
        level: string;
        type: string | null;
      }[]
    | null;
  profiles:
    | {
        email: string;
        full_name: string | null;
      }
    | {
        email: string;
        full_name: string | null;
      }[]
    | null;
};

function getRecord<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function mapBookingForEvent(record: BookingRecord): MicrosoftCalendarBookingForEvent {
  const facility = getRecord(record.facilities);
  const owner = getRecord(record.profiles);

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    facility: facility
      ? {
          name: facility.name,
          level: facility.level,
        }
      : null,
    owner: owner
      ? {
          email: owner.email,
          fullName: owner.full_name,
        }
      : null,
  };
}

function mapBookingForN8nEvent(record: BookingRecord): N8nCalendarBookingForEvent {
  const facility = getRecord(record.facilities);
  const owner = getRecord(record.profiles);

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    attendeeCount: record.attendee_count,
    catering: {
      required: Boolean(record.catering_required),
      type: record.catering_type,
      pax: record.catering_pax,
      servingTime: record.catering_serving_time,
      dietaryNotes: record.catering_dietary_notes,
      notes: record.catering_notes,
    },
    facility: facility
      ? {
          name: facility.name,
          level: facility.level,
          type: facility.type,
        }
      : null,
    owner: owner
      ? {
          email: owner.email,
          fullName: owner.full_name,
        }
      : null,
  };
}

async function getBookingForSync(bookingId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      title,
      description,
      status,
      starts_at,
      ends_at,
      attendee_count,
      catering_required,
      catering_type,
      catering_pax,
      catering_serving_time,
      catering_dietary_notes,
      catering_notes,
      facilities (
        name,
        level,
        type
      ),
      profiles!bookings_user_id_fkey (
        email,
        full_name
      )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(`Booking lookup for calendar sync failed: ${error.message}`);
  }

  return data ? (data as unknown as BookingRecord) : null;
}

type CalendarSyncProviderRecord = "microsoft_365" | "n8n_webhook";

async function getSyncRecord(
  bookingId: string,
  provider: CalendarSyncProviderRecord = "microsoft_365",
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_calendar_syncs")
    .select(
      "id,booking_id,provider,external_calendar_id,external_event_id,sync_status,attempts,last_error",
    )
    .eq("booking_id", bookingId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new Error(`Calendar sync tracking lookup failed: ${error.message}`);
  }

  return data ? (data as SyncRecord) : null;
}

async function upsertSyncRecord({
  bookingId,
  provider = "microsoft_365",
  calendarId,
  eventId,
  status,
  lastError,
  attempts,
}: {
  bookingId: string;
  provider?: CalendarSyncProviderRecord;
  calendarId: string | null;
  eventId: string | null;
  status: MicrosoftCalendarSyncStatus;
  lastError?: string | null;
  attempts?: number;
}) {
  const supabase = createAdminClient();
  const payload = {
    booking_id: bookingId,
    provider,
    external_calendar_id: calendarId,
    external_event_id: eventId,
    sync_status: status,
    sync_direction: "outbound",
    last_synced_at: ["synced", "cancelled", "skipped"].includes(status)
      ? new Date().toISOString()
      : null,
    last_error: lastError ?? null,
    ...(typeof attempts === "number" ? { attempts } : {}),
  };
  const { data, error } = await supabase
    .from("booking_calendar_syncs")
    .upsert(payload, { onConflict: "booking_id,provider" })
    .select(
      "id,booking_id,provider,external_calendar_id,external_event_id,sync_status,attempts,last_error",
    )
    .single();

  if (error) {
    throw new Error(`Calendar sync tracking update failed: ${error.message}`);
  }

  return data as SyncRecord;
}

async function markFailed({
  bookingId,
  provider = "microsoft_365",
  calendarId,
  eventId,
  error,
}: {
  bookingId: string;
  provider?: CalendarSyncProviderRecord;
  calendarId: string | null;
  eventId: string | null;
  error: unknown;
}) {
  const existing = await getSyncRecord(bookingId, provider).catch(() => null);
  const sanitizedError = sanitizeMicrosoftCalendarError(error);
  return upsertSyncRecord({
    bookingId,
    provider,
    calendarId,
    eventId,
    status: "failed",
    lastError: sanitizedError,
    attempts: (existing?.attempts ?? 0) + 1,
  });
}

async function tryMarkFailed(input: {
  bookingId: string;
  provider?: CalendarSyncProviderRecord;
  calendarId: string | null;
  eventId: string | null;
  error: unknown;
}) {
  try {
    return await markFailed(input);
  } catch (trackingError) {
    console.error("Microsoft calendar sync tracking failed", {
      bookingId: input.bookingId,
      message: sanitizeMicrosoftCalendarError(trackingError),
    });
    return null;
  }
}

async function auditCalendarSync({
  bookingId,
  status,
  summary,
  actor,
  integration = "microsoft_365_calendar",
  metadata = {},
}: {
  bookingId: string;
  status: MicrosoftCalendarSyncStatus;
  summary: string;
  actor?: SyncActor;
  integration?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await createAuditLogSafely(
    supabase,
    {
      action: "update",
      entityType: "booking",
      entityId: bookingId,
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? null,
      summary,
      newValues: {
        microsoftCalendarSyncStatus: status,
      },
      metadata: {
        integration,
        ...(actor?.reason ? { reason: actor.reason } : {}),
        ...metadata,
      },
    },
    { bookingId, integration },
  );
}

async function syncConfirmedBookingToN8nCalendar(
  bookingId: string,
  actor?: SyncActor,
): Promise<MicrosoftCalendarSyncResult> {
  const config = getN8nCalendarSyncConfig();
  const provider: CalendarSyncProviderRecord = "n8n_webhook";

  if (!config.enabled) {
    return {
      status: "skipped",
      message: "n8n calendar webhook sync is disabled.",
      bookingId,
    };
  }

  if (!config.isConfigured) {
    const record = await tryMarkFailed({
      bookingId,
      provider,
      calendarId: null,
      eventId: null,
      error: config.validationError ?? "n8n calendar webhook sync is not configured.",
    });

    await auditCalendarSync({
      bookingId,
      status: "failed",
      actor,
      integration: "n8n_calendar_webhook",
      summary: "n8n calendar webhook sync failed because configuration is incomplete.",
      metadata: { syncId: record?.id ?? null },
    });

    return {
      status: "failed",
      message: record?.last_error ?? "n8n calendar webhook sync is not configured.",
      bookingId,
      syncId: record?.id,
    };
  }

  try {
    const booking = await getBookingForSync(bookingId);

    if (!booking) {
      throw new Error("Booking could not be found for n8n calendar webhook sync.");
    }

    if (booking.status !== "confirmed") {
      const record = await upsertSyncRecord({
        bookingId,
        provider,
        calendarId: null,
        eventId: null,
        status: "skipped",
        lastError: null,
      });

      return {
        status: "skipped",
        message: "Only confirmed bookings are sent to the n8n calendar webhook.",
        bookingId,
        syncId: record.id,
      };
    }

    const existing = await getSyncRecord(bookingId, provider);

    if (existing?.external_event_id && !config.updateWebhookConfigured) {
      const record = await upsertSyncRecord({
        bookingId,
        provider,
        calendarId: existing.external_calendar_id,
        eventId: existing.external_event_id,
        status: "skipped",
        lastError:
          "n8n update webhook is not configured. Existing event was left unchanged.",
        attempts: existing.attempts,
      });

      return {
        status: "skipped",
        message: record.last_error ?? "n8n update webhook is not configured.",
        bookingId,
        syncId: record.id,
        externalEventId: existing.external_event_id,
      };
    }

    const settings = await getAppSettings();
    const bookingForN8n = mapBookingForN8nEvent(booking);
    const response = existing?.external_event_id
      ? await sendN8nCalendarUpdateWebhook({
          config,
          payload: buildN8nCalendarUpdatePayload({
            booking: bookingForN8n,
            externalEventId: existing.external_event_id,
            timezone: settings.defaultTimezone,
          }),
        })
      : await sendN8nCalendarCreateWebhook({
          config,
          payload: buildN8nCalendarCreatePayload({
            booking: bookingForN8n,
            timezone: settings.defaultTimezone,
          }),
        });

    if (!response.ok) {
      throw new Error(response.error);
    }

    const record = await upsertSyncRecord({
      bookingId,
      provider,
      calendarId: response.externalCalendarId,
      eventId: response.externalEventId,
      status: "synced",
      lastError: null,
      attempts: existing?.attempts ?? 0,
    });

    await auditCalendarSync({
      bookingId,
      status: "synced",
      actor,
      integration: "n8n_calendar_webhook",
      summary: existing?.external_event_id
        ? "Updated n8n calendar webhook event for booking."
        : "Created n8n calendar webhook event for booking.",
      metadata: {
        syncId: record.id,
        externalCalendarId: response.externalCalendarId,
        n8nProvider: response.provider,
      },
    });

    return {
      status: "synced",
      message: existing?.external_event_id
        ? "n8n calendar webhook event updated."
        : "n8n calendar webhook event created.",
      bookingId,
      syncId: record.id,
      externalEventId: response.externalEventId,
    };
  } catch (error) {
    const existing = await getSyncRecord(bookingId, provider).catch(() => null);
    const record = await tryMarkFailed({
      bookingId,
      provider,
      calendarId: existing?.external_calendar_id ?? null,
      eventId: existing?.external_event_id ?? null,
      error,
    });

    await auditCalendarSync({
      bookingId,
      status: "failed",
      actor,
      integration: "n8n_calendar_webhook",
      summary: "n8n calendar webhook sync failed for booking.",
      metadata: { syncId: record?.id ?? null },
    });

    return {
      status: "failed",
      message: record?.last_error ?? "n8n calendar webhook sync failed.",
      bookingId,
      syncId: record?.id,
      externalEventId: record?.external_event_id,
    };
  }
}

async function deleteN8nCalendarEventForBooking(
  bookingId: string,
  actor?: SyncActor,
): Promise<MicrosoftCalendarSyncResult> {
  const config = getN8nCalendarSyncConfig();
  const provider: CalendarSyncProviderRecord = "n8n_webhook";
  const existing = await getSyncRecord(bookingId, provider).catch(() => null);

  if (!existing?.external_event_id) {
    const record = await upsertSyncRecord({
      bookingId,
      provider,
      calendarId: existing?.external_calendar_id ?? null,
      eventId: null,
      status: "skipped",
      lastError: "No n8n calendar event exists for this booking.",
      attempts: existing?.attempts ?? 0,
    });

    return {
      status: "skipped",
      message: record.last_error ?? "No n8n calendar event exists.",
      bookingId,
      syncId: record.id,
    };
  }

  if (!config.deleteWebhookConfigured) {
    const record = await upsertSyncRecord({
      bookingId,
      provider,
      calendarId: existing.external_calendar_id,
      eventId: existing.external_event_id,
      status: "skipped",
      lastError:
        "n8n delete webhook is not configured. Existing event was left unchanged.",
      attempts: existing.attempts,
    });

    await auditCalendarSync({
      bookingId,
      status: "skipped",
      actor,
      integration: "n8n_calendar_webhook",
      summary: "Skipped n8n calendar delete because delete webhook is not configured.",
      metadata: { syncId: record.id },
    });

    return {
      status: "skipped",
      message: record.last_error ?? "n8n delete webhook is not configured.",
      bookingId,
      syncId: record.id,
      externalEventId: record.external_event_id,
    };
  }

  try {
    const response = await sendN8nCalendarDeleteWebhook({
      config,
      payload: buildN8nCalendarDeletePayload({
        bookingId,
        externalEventId: existing.external_event_id,
      }),
    });

    if (!response.ok) {
      throw new Error(response.error);
    }

    const record = await upsertSyncRecord({
      bookingId,
      provider,
      calendarId: response.externalCalendarId ?? existing.external_calendar_id,
      eventId: response.externalEventId,
      status: "cancelled",
      lastError: null,
      attempts: existing.attempts,
    });

    await auditCalendarSync({
      bookingId,
      status: "cancelled",
      actor,
      integration: "n8n_calendar_webhook",
      summary: "Deleted n8n calendar webhook event for booking.",
      metadata: {
        syncId: record.id,
        n8nProvider: response.provider,
      },
    });

    return {
      status: "cancelled",
      message: "n8n calendar webhook event deleted.",
      bookingId,
      syncId: record.id,
      externalEventId: response.externalEventId,
    };
  } catch (error) {
    const record = await tryMarkFailed({
      bookingId,
      provider,
      calendarId: existing.external_calendar_id,
      eventId: existing.external_event_id,
      error,
    });

    await auditCalendarSync({
      bookingId,
      status: "failed",
      actor,
      integration: "n8n_calendar_webhook",
      summary: "n8n calendar webhook delete failed for booking.",
      metadata: { syncId: record?.id ?? null },
    });

    return {
      status: "failed",
      message: record?.last_error ?? "n8n calendar webhook delete failed.",
      bookingId,
      syncId: record?.id,
      externalEventId: record?.external_event_id,
    };
  }
}

export async function syncConfirmedBookingToMicrosoftCalendar(
  bookingId: string,
  actor?: SyncActor,
): Promise<MicrosoftCalendarSyncResult> {
  const n8nConfig = getN8nCalendarSyncConfig();

  if (n8nConfig.provider === "n8n_webhook") {
    return syncConfirmedBookingToN8nCalendar(bookingId, actor);
  }

  const config = getMicrosoftCalendarSyncConfig();

  if (
    config.provider !== "microsoft_graph" ||
    !config.enabled ||
    config.mode === "disabled"
  ) {
    return {
      status: "skipped",
      message: "Microsoft 365 Calendar sync is disabled.",
      bookingId,
    };
  }

  if (!config.isConfigured) {
    const record = await tryMarkFailed({
      bookingId,
      calendarId: config.defaultCalendarId || null,
      eventId: null,
      error:
        config.validationError ??
        "Microsoft 365 Calendar sync is not configured.",
    });

    await auditCalendarSync({
      bookingId,
      status: "failed",
      actor,
      summary: "Microsoft 365 Calendar sync failed because configuration is incomplete.",
      metadata: { syncId: record?.id ?? null },
    });

    return {
      status: "failed",
      message:
        record?.last_error ?? "Microsoft 365 Calendar sync is not configured.",
      bookingId,
      syncId: record?.id,
    };
  }

  try {
    const booking = await getBookingForSync(bookingId);

    if (!booking) {
      throw new Error("Booking could not be found for Microsoft 365 Calendar sync.");
    }

    if (booking.status !== "confirmed") {
      const record = await upsertSyncRecord({
        bookingId,
        calendarId: config.defaultCalendarId,
        eventId: null,
        status: "skipped",
        lastError: null,
      });

      return {
        status: "skipped",
        message: "Only confirmed bookings are synced to Microsoft 365 Calendar.",
        bookingId,
        syncId: record.id,
      };
    }

    const existing = await getSyncRecord(bookingId);
    const settings = await getAppSettings();
    const payload = buildMicrosoftCalendarEventPayload({
      booking: mapBookingForEvent(booking),
      timezone: settings.defaultTimezone,
    });
    const path = existing?.external_event_id
      ? buildMicrosoftGraphPath(
          "users",
          config.defaultCalendarId,
          "events",
          existing.external_event_id,
        )
      : buildMicrosoftGraphPath("users", config.defaultCalendarId, "events");
    const response = await microsoftGraphFetch<MicrosoftGraphEventResponse>(
      path,
      {
        method: existing?.external_event_id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(response.error);
    }

    const externalEventId =
      response.data?.id ?? existing?.external_event_id ?? null;
    const record = await upsertSyncRecord({
      bookingId,
      calendarId: config.defaultCalendarId,
      eventId: externalEventId,
      status: "synced",
      lastError: null,
      attempts: existing?.attempts ?? 0,
    });

    await auditCalendarSync({
      bookingId,
      status: "synced",
      actor,
      summary: existing?.external_event_id
        ? "Updated Microsoft 365 Calendar event for booking."
        : "Created Microsoft 365 Calendar event for booking.",
      metadata: {
        syncId: record.id,
        externalCalendarId: config.defaultCalendarId,
      },
    });

    return {
      status: "synced",
      message: "Microsoft 365 Calendar event synced.",
      bookingId,
      syncId: record.id,
      externalEventId,
    };
  } catch (error) {
    const existing = await getSyncRecord(bookingId).catch(() => null);
    const record = await tryMarkFailed({
      bookingId,
      calendarId: config.defaultCalendarId || existing?.external_calendar_id || null,
      eventId: existing?.external_event_id ?? null,
      error,
    });

    await auditCalendarSync({
      bookingId,
      status: "failed",
      actor,
      summary: "Microsoft 365 Calendar sync failed for booking.",
      metadata: { syncId: record?.id ?? null },
    });

    return {
      status: "failed",
      message: record?.last_error ?? "Microsoft 365 Calendar sync failed.",
      bookingId,
      syncId: record?.id,
      externalEventId: record?.external_event_id,
    };
  }
}

export async function cancelMicrosoftCalendarEventForBooking(
  bookingId: string,
  actor?: SyncActor,
): Promise<MicrosoftCalendarSyncResult> {
  const n8nConfig = getN8nCalendarSyncConfig();

  if (n8nConfig.provider === "n8n_webhook") {
    if (!n8nConfig.enabled) {
      return {
        status: "skipped",
        message: "n8n calendar webhook sync is disabled.",
        bookingId,
      };
    }

    return deleteN8nCalendarEventForBooking(bookingId, actor);
  }

  const config = getMicrosoftCalendarSyncConfig();

  if (
    config.provider !== "microsoft_graph" ||
    !config.enabled ||
    config.mode === "disabled"
  ) {
    return {
      status: "skipped",
      message: "Microsoft 365 Calendar sync is disabled.",
      bookingId,
    };
  }

  try {
    const existing = await getSyncRecord(bookingId);

    if (!existing?.external_event_id) {
      const record = await upsertSyncRecord({
        bookingId,
        calendarId: config.defaultCalendarId || existing?.external_calendar_id || null,
        eventId: null,
        status: "skipped",
        lastError: "No Microsoft 365 Calendar event exists for this booking.",
      });

      return {
        status: "skipped",
        message: "No Microsoft 365 Calendar event exists for this booking.",
        bookingId,
        syncId: record.id,
      };
    }

    if (!config.isConfigured) {
      throw new Error(
        config.validationError ??
          "Microsoft 365 Calendar sync is not configured.",
      );
    }

    const calendarId = existing.external_calendar_id || config.defaultCalendarId;
    const response = await microsoftGraphFetch<null>(
      buildMicrosoftGraphPath("users", calendarId, "events", existing.external_event_id),
      { method: "DELETE" },
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(response.error);
    }

    const record = await upsertSyncRecord({
      bookingId,
      calendarId,
      eventId: existing.external_event_id,
      status: "cancelled",
      lastError:
        response.ok || response.status !== 404
          ? null
          : "Microsoft 365 Calendar event was already missing.",
      attempts: existing.attempts,
    });

    await auditCalendarSync({
      bookingId,
      status: "cancelled",
      actor,
      summary: "Cancelled Microsoft 365 Calendar event for booking.",
      metadata: {
        syncId: record.id,
        externalCalendarId: calendarId,
      },
    });

    return {
      status: "cancelled",
      message: "Microsoft 365 Calendar event cancelled.",
      bookingId,
      syncId: record.id,
      externalEventId: existing.external_event_id,
    };
  } catch (error) {
    const existing = await getSyncRecord(bookingId).catch(() => null);
    const record = await tryMarkFailed({
      bookingId,
      calendarId: config.defaultCalendarId || existing?.external_calendar_id || null,
      eventId: existing?.external_event_id ?? null,
      error,
    });

    await auditCalendarSync({
      bookingId,
      status: "failed",
      actor,
      summary: "Microsoft 365 Calendar cancellation failed for booking.",
      metadata: { syncId: record?.id ?? null },
    });

    return {
      status: "failed",
      message: record?.last_error ?? "Microsoft 365 Calendar cancellation failed.",
      bookingId,
      syncId: record?.id,
      externalEventId: record?.external_event_id,
    };
  }
}

export async function retryMicrosoftCalendarSync(
  bookingId: string,
  actor?: SyncActor,
) {
  const booking = await getBookingForSync(bookingId);

  if (!booking) {
    return {
      status: "failed" as const,
      message: "Booking could not be found for Microsoft 365 Calendar retry.",
      bookingId,
    };
  }

  if (booking.status === "confirmed") {
    return syncConfirmedBookingToMicrosoftCalendar(bookingId, {
      ...actor,
      reason: actor?.reason ?? "manual_retry",
    });
  }

  if (booking.status === "cancelled") {
    return cancelMicrosoftCalendarEventForBooking(bookingId, {
      ...actor,
      reason: actor?.reason ?? "manual_retry",
    });
  }

  const config = getMicrosoftCalendarSyncConfig();
  const record = await upsertSyncRecord({
    bookingId,
    provider:
      getN8nCalendarSyncConfig().provider === "n8n_webhook"
        ? "n8n_webhook"
        : "microsoft_365",
    calendarId: config.defaultCalendarId || null,
    eventId: null,
    status: "skipped",
    lastError: `Booking status ${booking.status} is not synced to Microsoft 365 Calendar.`,
  });

  return {
    status: "skipped" as const,
    message: record.last_error ?? "Booking status is not eligible for sync.",
    bookingId,
    syncId: record.id,
  };
}
