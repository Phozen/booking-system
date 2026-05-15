import "server-only";

import { getMicrosoftCalendarSyncConfig } from "@/lib/integrations/microsoft-365-calendar/config";
import type { MicrosoftCalendarSyncStatus } from "@/lib/integrations/microsoft-365-calendar/types";
import { createAdminClient } from "@/lib/supabase/admin";

type SyncBookingRecord =
  | {
      id: string;
      title: string;
      status: string;
      starts_at: string;
      ends_at: string;
      facilities:
        | {
            name: string;
            level: string;
          }
        | {
            name: string;
            level: string;
          }[]
        | null;
    }
  | {
      id: string;
      title: string;
      status: string;
      starts_at: string;
      ends_at: string;
      facilities:
        | {
            name: string;
            level: string;
          }
        | {
            name: string;
            level: string;
          }[]
        | null;
    }[]
  | null;

type SyncRecord = {
  id: string;
  booking_id: string;
  provider: string;
  external_calendar_id: string | null;
  external_event_id: string | null;
  sync_status: MicrosoftCalendarSyncStatus;
  attempts: number;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  bookings: SyncBookingRecord;
};

export type AdminMicrosoftCalendarSyncRecord = {
  id: string;
  bookingId: string;
  provider: string;
  externalCalendarId: string | null;
  externalEventId: string | null;
  status: MicrosoftCalendarSyncStatus;
  attempts: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    title: string;
    status: string;
    startsAt: string;
    endsAt: string;
    facilityName: string | null;
    facilityLevel: string | null;
  } | null;
};

function getRecord<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function mapRecord(record: SyncRecord): AdminMicrosoftCalendarSyncRecord {
  const booking = getRecord(record.bookings);
  const facility = getRecord(booking?.facilities);

  return {
    id: record.id,
    bookingId: record.booking_id,
    provider: record.provider,
    externalCalendarId: record.external_calendar_id,
    externalEventId: record.external_event_id,
    status: record.sync_status,
    attempts: record.attempts,
    lastSyncedAt: record.last_synced_at,
    lastError: record.last_error,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    booking: booking
      ? {
          id: booking.id,
          title: booking.title,
          status: booking.status,
          startsAt: booking.starts_at,
          endsAt: booking.ends_at,
          facilityName: facility?.name ?? null,
          facilityLevel: facility?.level ?? null,
        }
      : null,
  };
}

export async function getMicrosoftCalendarIntegrationStatus() {
  const config = getMicrosoftCalendarSyncConfig();

  return {
    enabled: config.enabled,
    mode: config.mode,
    isConfigured: config.isConfigured,
    validationError: config.validationError,
    defaultCalendarId: config.defaultCalendarId,
    graphBaseUrl: config.graphBaseUrl,
  };
}

export async function getMicrosoftCalendarSyncRecords(limit = 50) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_calendar_syncs")
    .select(
      `
      id,
      booking_id,
      provider,
      external_calendar_id,
      external_event_id,
      sync_status,
      attempts,
      last_synced_at,
      last_error,
      created_at,
      updated_at,
      bookings (
        id,
        title,
        status,
        starts_at,
        ends_at,
        facilities (
          name,
          level
        )
      )
    `,
    )
    .eq("provider", "microsoft_365")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Unable to load Microsoft 365 Calendar sync records.");
  }

  return ((data as unknown as SyncRecord[] | null) ?? []).map(mapRecord);
}
