import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingStatus } from "@/lib/bookings/queries";
import type { CalendarDateRange } from "@/lib/calendar/date-range";
import type { FacilityType } from "@/lib/facilities/validation";

type AdminCalendarFacilityRecord =
  | {
      id: string;
      code: string;
      name: string;
      level: string;
      type: FacilityType;
    }
  | {
      id: string;
      code: string;
      name: string;
      level: string;
      type: FacilityType;
    }[]
  | null;

type AdminCalendarProfileRecord =
  | {
      id: string;
      email: string;
      full_name: string | null;
    }
  | {
      id: string;
      email: string;
      full_name: string | null;
    }[]
  | null;

type AdminCalendarBookingRecord = {
  id: string;
  facility_id: string;
  user_id: string;
  title: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  approval_required: boolean;
  facilities?: AdminCalendarFacilityRecord;
  profiles?: AdminCalendarProfileRecord;
};

export type AdminCalendarBooking = {
  id: string;
  facilityId: string;
  userId: string;
  title: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  approvalRequired: boolean;
  facility: {
    id: string;
    code: string;
    name: string;
    level: string;
    type: FacilityType;
  } | null;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
};

export type AdminCalendarFilters = {
  facilityId?: string;
  status?: BookingStatus;
};

const adminCalendarSelect = `
  id,
  facility_id,
  user_id,
  title,
  status,
  starts_at,
  ends_at,
  approval_required,
  facilities (
    id,
    code,
    name,
    level,
    type
  ),
  profiles!bookings_user_id_fkey (
    id,
    email,
    full_name
  )
`;

function mapAdminCalendarBooking(
  record: AdminCalendarBookingRecord,
): AdminCalendarBooking {
  const facilityRecord = Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;
  const userRecord = Array.isArray(record.profiles)
    ? record.profiles[0]
    : record.profiles;

  return {
    id: record.id,
    facilityId: record.facility_id,
    userId: record.user_id,
    title: record.title,
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    approvalRequired: record.approval_required,
    facility: facilityRecord
      ? {
          id: facilityRecord.id,
          code: facilityRecord.code,
          name: facilityRecord.name,
          level: facilityRecord.level,
          type: facilityRecord.type,
        }
      : null,
    user: userRecord
      ? {
          id: userRecord.id,
          email: userRecord.email,
          fullName: userRecord.full_name,
        }
      : null,
  };
}

export async function getAdminCalendarBookings(
  supabase: SupabaseClient,
  range: Pick<CalendarDateRange, "startsAt" | "endsAt">,
  filters: AdminCalendarFilters = {},
) {
  let query = supabase
    .from("bookings")
    .select(adminCalendarSelect)
    .lt("starts_at", range.endsAt)
    .gt("ends_at", range.startsAt)
    .order("starts_at", { ascending: true });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.facilityId) {
    query = query.eq("facility_id", filters.facilityId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load admin calendar bookings.");
  }

  return ((data as unknown as AdminCalendarBookingRecord[] | null) ?? []).map(
    mapAdminCalendarBooking,
  );
}
