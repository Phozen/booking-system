import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingStatus } from "@/lib/bookings/queries";
import type { CalendarDateRange } from "@/lib/calendar/date-range";
import type { FacilityType } from "@/lib/facilities/validation";

type EmployeeCalendarFacilityRecord =
  | {
      id: string;
      name: string;
      level: string;
      type: FacilityType;
    }
  | {
      id: string;
      name: string;
      level: string;
      type: FacilityType;
    }[]
  | null;

type EmployeeCalendarBookingRecord = {
  id: string;
  facility_id: string;
  user_id: string;
  title: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  approval_required: boolean;
  facilities?: EmployeeCalendarFacilityRecord;
};

export type EmployeeCalendarBooking = {
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
    name: string;
    level: string;
    type: FacilityType;
  } | null;
};

export type EmployeeCalendarFilters = {
  status?: BookingStatus;
};

const employeeCalendarSelect = `
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
    name,
    level,
    type
  )
`;

function mapEmployeeCalendarBooking(
  record: EmployeeCalendarBookingRecord,
): EmployeeCalendarBooking {
  const facilityRecord = Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;

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
          name: facilityRecord.name,
          level: facilityRecord.level,
          type: facilityRecord.type,
        }
      : null,
  };
}

export async function getEmployeeCalendarBookings(
  supabase: SupabaseClient,
  userId: string,
  range: Pick<CalendarDateRange, "startsAt" | "endsAt">,
  filters: EmployeeCalendarFilters = {},
) {
  let query = supabase
    .from("bookings")
    .select(employeeCalendarSelect)
    .eq("user_id", userId)
    .lt("starts_at", range.endsAt)
    .gt("ends_at", range.startsAt)
    .order("starts_at", { ascending: true });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load calendar bookings.");
  }

  return ((data as unknown as EmployeeCalendarBookingRecord[] | null) ?? []).map(
    mapEmployeeCalendarBooking,
  );
}
