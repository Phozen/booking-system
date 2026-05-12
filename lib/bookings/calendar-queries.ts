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

type EmployeeCalendarProfileRecord =
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
  profiles?: EmployeeCalendarProfileRecord;
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
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  visibilityContext?: "owned" | "invited" | "other";
};

export type EmployeeCalendarFilters = {
  status?: BookingStatus;
  facilityId?: string;
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

const companyCalendarSelect = `
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
  ),
  profiles!bookings_user_id_fkey (
    id,
    email,
    full_name
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
  visibilityContext?: "owned" | "invited" | "other",
): EmployeeCalendarBooking {
  const facilityRecord = Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;
  const profileRecord = Array.isArray(record.profiles)
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
          name: facilityRecord.name,
          level: facilityRecord.level,
          type: facilityRecord.type,
        }
      : null,
    invitationStatus,
    user: profileRecord
      ? {
          id: profileRecord.id,
          email: profileRecord.email,
          fullName: profileRecord.full_name,
        }
      : null,
    visibilityContext:
      visibilityContext ??
      (invitationStatus ? "invited" : undefined),
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

  if (filters.facilityId) {
    query = query.eq("facility_id", filters.facilityId);
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

  if (filters.facilityId) {
    invitationQuery = invitationQuery.eq("bookings.facility_id", filters.facilityId);
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

export async function getCompanyCalendarBookings(
  supabase: SupabaseClient,
  currentUserId: string,
  range: Pick<CalendarDateRange, "startsAt" | "endsAt">,
  filters: EmployeeCalendarFilters = {},
) {
  let query = supabase
    .from("bookings")
    .select(companyCalendarSelect)
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
    throw new Error("Unable to load company calendar bookings.");
  }

  const records =
    (data as unknown as EmployeeCalendarBookingRecord[] | null) ?? [];
  const bookingIds = records.map((booking) => booking.id);
  const invitationStatusByBookingId = new Map<
    string,
    Exclude<BookingInvitationStatus, "removed">
  >();

  if (bookingIds.length > 0) {
    const { data: invitationData, error: invitationError } = await supabase
      .from("booking_invitations")
      .select("booking_id,status")
      .eq("invited_user_id", currentUserId)
      .in("status", ["pending", "accepted"])
      .in("booking_id", bookingIds);

    if (invitationError) {
      throw new Error("Unable to load company calendar invitation context.");
    }

    for (const invitation of
      (invitationData as
        | { booking_id: string; status: Exclude<BookingInvitationStatus, "removed"> }[]
        | null) ?? []) {
      invitationStatusByBookingId.set(invitation.booking_id, invitation.status);
    }
  }

  return records.map((booking) => {
    const invitationStatus = invitationStatusByBookingId.get(booking.id);
    const context =
      booking.user_id === currentUserId
        ? "owned"
        : invitationStatus
          ? "invited"
          : "other";

    return mapEmployeeCalendarBooking(booking, invitationStatus, context);
  });
}
