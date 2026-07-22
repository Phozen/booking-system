import type { SupabaseClient } from "@supabase/supabase-js";

import { getEmployeeFacilities } from "@/lib/facilities/queries";
import type { BookingCateringDetails } from "@/lib/bookings/catering/format";
import type { FacilityType } from "@/lib/facilities/validation";

export async function getBookableFacilities(supabase: SupabaseClient) {
  return getEmployeeFacilities(supabase);
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "expired";

export type ApprovalStatus = "pending" | "approved" | "rejected";

type BookingFacilityRecord =
  | {
      id: string;
      name: string;
      slug: string;
      level: string;
      type: FacilityType;
      capacity: number;
    }
  | {
      id: string;
      name: string;
      slug: string;
      level: string;
      type: FacilityType;
      capacity: number;
    }[]
  | null;

type BookingApprovalRecord = {
  id: string;
  status: ApprovalStatus;
  requested_at: string;
  reviewed_at: string | null;
  remarks: string | null;
};

type BookingDepartmentRecord = {
  departments?: { id: string; name: string; email: string; is_active: boolean } | null;
};

type BookingRecord = {
  id: string;
  facility_id: string;
  user_id: string;
  title: string;
  description: string | null;
  attendee_count: number | null;
  teams_meeting: boolean | null;
  catering_required: boolean | null;
  catering_type: BookingCateringDetails["type"] | null;
  catering_pax: number | null;
  catering_serving_time: BookingCateringDetails["servingTime"] | null;
  catering_dietary_notes: string | null;
  catering_notes: string | null;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  approval_required: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  facilities?: BookingFacilityRecord;
  booking_approvals?: BookingApprovalRecord[] | null;
  booking_departments?: BookingDepartmentRecord[] | null;
};

export type BookingFacility = {
  id: string;
  name: string;
  slug: string;
  level: string;
  type: FacilityType;
  capacity: number;
};

export type EmployeeBooking = {
  id: string;
  facilityId: string;
  userId: string;
  title: string;
  description: string | null;
  attendeeCount: number | null;
  teamsMeeting: boolean;
  catering: BookingCateringDetails;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  approvalRequired: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  facility: BookingFacility | null;
  approvals: {
    id: string;
    status: ApprovalStatus;
    requestedAt: string;
    reviewedAt: string | null;
    remarks: string | null;
  }[];
  departments: { id: string; name: string; email: string; isActive: boolean }[];
};

const employeeBookingBaseSelect = `
  id,
  facility_id,
  user_id,
  title,
  description,
  attendee_count,
  teams_meeting,
  catering_required,
  catering_type,
  catering_pax,
  catering_serving_time,
  catering_dietary_notes,
  catering_notes,
  status,
  starts_at,
  ends_at,
  approval_required,
  cancellation_reason,
  cancelled_at,
  created_at,
  updated_at,
  facilities (
    id,
    name,
    slug,
    level,
    type,
    capacity
  ),
  booking_departments (departments (id, name, email, is_active))
`;

const employeeBookingSelect = `
  ${employeeBookingBaseSelect},
  booking_approvals (
    id,
    status,
    requested_at,
    reviewed_at,
    remarks
  )
`;

function logEmployeeBookingLookupError({
  scope,
  error,
}: {
  scope: string;
  error: { code?: string; message?: string; details?: string | null; hint?: string | null };
}) {
  console.error("Employee booking lookup failed", {
    scope,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function mapBooking(record: BookingRecord): EmployeeBooking {
  const facilityRecord = Array.isArray(record.facilities)
    ? record.facilities[0]
    : record.facilities;

  return {
    id: record.id,
    facilityId: record.facility_id,
    userId: record.user_id,
    title: record.title,
    description: record.description,
    attendeeCount: record.attendee_count,
    teamsMeeting: Boolean(record.teams_meeting),
    catering: {
      required: Boolean(record.catering_required),
      type: record.catering_type,
      pax: record.catering_pax,
      servingTime: record.catering_serving_time,
      dietaryNotes: record.catering_dietary_notes,
      notes: record.catering_notes,
    },
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    approvalRequired: record.approval_required,
    cancellationReason: record.cancellation_reason,
    cancelledAt: record.cancelled_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    facility: facilityRecord
      ? {
          id: facilityRecord.id,
          name: facilityRecord.name,
          slug: facilityRecord.slug,
          level: facilityRecord.level,
          type: facilityRecord.type,
          capacity: facilityRecord.capacity,
        }
      : null,
    approvals: (record.booking_approvals ?? []).map((approval) => ({
      id: approval.id,
      status: approval.status,
      requestedAt: approval.requested_at,
      reviewedAt: approval.reviewed_at,
      remarks: approval.remarks,
    })),
    departments: (record.booking_departments ?? []).flatMap((item) => item.departments ? [{
      id: item.departments.id, name: item.departments.name, email: item.departments.email,
      isActive: item.departments.is_active,
    }] : []),
  };
}

export async function getMyBookings(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(employeeBookingSelect)
    .eq("user_id", userId)
    .order("starts_at", { ascending: false });

  if (error) {
    logEmployeeBookingLookupError({ scope: "my-bookings", error });

    const fallback = await supabase
      .from("bookings")
      .select(employeeBookingBaseSelect)
      .eq("user_id", userId)
      .order("starts_at", { ascending: false });

    if (fallback.error) {
      logEmployeeBookingLookupError({
        scope: "my-bookings-fallback",
        error: fallback.error,
      });
      throw new Error("Unable to load bookings.");
    }

    return (
      (fallback.data as unknown as BookingRecord[] | null) ?? []
    ).map(mapBooking);
  }

  return ((data as unknown as BookingRecord[] | null) ?? []).map(mapBooking);
}

export async function getMyUpcomingBookings(
  supabase: SupabaseClient,
  userId: string,
  limit = 3,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(employeeBookingBaseSelect)
    .eq("user_id", userId)
    .in("status", ["pending", "confirmed"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    logEmployeeBookingLookupError({ scope: "upcoming-bookings", error });
    throw new Error("Unable to load upcoming bookings.");
  }

  return ((data as unknown as BookingRecord[] | null) ?? []).map(mapBooking);
}

export async function getMyBookingById(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(employeeBookingSelect)
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logEmployeeBookingLookupError({ scope: "booking-detail", error });

    const fallback = await supabase
      .from("bookings")
      .select(employeeBookingBaseSelect)
      .eq("id", bookingId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fallback.error) {
      logEmployeeBookingLookupError({
        scope: "booking-detail-fallback",
        error: fallback.error,
      });
      throw new Error("Unable to load booking.");
    }

    return fallback.data
      ? mapBooking(fallback.data as unknown as BookingRecord)
      : null;
  }

  return data ? mapBooking(data as unknown as BookingRecord) : null;
}
