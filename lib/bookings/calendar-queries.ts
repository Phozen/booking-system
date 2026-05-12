import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingStatus } from "@/lib/bookings/queries";
import type { BookingInvitationStatus } from "@/lib/bookings/invitations/types";
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

type InvitedCalendarBookingRecord = {
  id: string;
  status: BookingInvitationStatus;
  bookings?:
    | EmployeeCalendarBookingRecord
    | EmployeeCalendarBookingRecord[]
    | null;
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
  invitationStatus?: Exclude<BookingInvitationStatus, "removed">;
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

const invitedCalendarSelect = `
  id,
  status,
  bookings!booking_invitations_booking_id_fkey!inner (
    ${employeeCalendarSelect}
  )
`;

function mapEmployeeCalendarBooking(
  record: EmployeeCalendarBookingRecord,
  invitationStatus?: Exclude<BookingInvitationStatus, "removed">,
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
    invitationStatus,
  };
}

function firstRecord<T>(record: T | T[] | null | undefined) {
  return Array.isArray(record) ? record[0] : record ?? null;
}

export async function getEmployeeCalendarBookings(
  supabase: SupabaseClient,
  userId: string,
  range: Pick<CalendarDateRange, "startsAt" | "endsAt">,
  filters: EmployeeCalendarFilters = {},
  invitationSupabase: SupabaseClient = supabase,
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

  const ownedBookings = (
    (data as unknown as EmployeeCalendarBookingRecord[] | null) ?? []
  ).map((booking) => mapEmployeeCalendarBooking(booking));

  let invitationQuery = invitationSupabase
    .from("booking_invitations")
    .select(invitedCalendarSelect)
    .eq("invited_user_id", userId)
    .in("status", ["pending", "accepted"])
    .lt("bookings.starts_at", range.endsAt)
    .gt("bookings.ends_at", range.startsAt);

  if (filters.status) {
    invitationQuery = invitationQuery.eq("bookings.status", filters.status);
  }

  const { data: invitedData, error: invitedError } = await invitationQuery;

  if (invitedError) {
    throw new Error("Unable to load invited calendar bookings.");
  }

  const invitedBookings = (
    (invitedData as unknown as InvitedCalendarBookingRecord[] | null) ?? []
  )
    .map((invitation) => {
      const booking = firstRecord(invitation.bookings);

      return booking
        ? mapEmployeeCalendarBooking(
            booking,
            invitation.status === "removed" ? undefined : invitation.status,
          )
        : null;
    })
    .filter((booking): booking is EmployeeCalendarBooking => Boolean(booking));

  return [...ownedBookings, ...invitedBookings].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
}
