import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApprovalStatus, BookingStatus } from "@/lib/bookings/queries";
import type { FacilityType } from "@/lib/facilities/validation";

type AdminBookingFacilityRecord =
  | {
      id: string;
      code: string;
      name: string;
      slug: string;
      level: string;
      type: FacilityType;
    }
  | {
      id: string;
      code: string;
      name: string;
      slug: string;
      level: string;
      type: FacilityType;
    }[]
  | null;

type AdminBookingProfileRecord =
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

type AdminBookingApprovalRecord = {
  id: string;
  status: ApprovalStatus;
  requested_by: string;
  reviewed_by: string | null;
  requested_at: string;
  reviewed_at: string | null;
  remarks: string | null;
};

type AdminBookingRecord = {
  id: string;
  facility_id: string;
  user_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  attendee_count: number | null;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  approval_required: boolean;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  facilities?: AdminBookingFacilityRecord;
  profiles?: AdminBookingProfileRecord;
  booking_approvals?: AdminBookingApprovalRecord[] | null;
};

export type AdminBookingFilters = {
  facilityId?: string;
  status?: BookingStatus;
};

export type AdminBooking = {
  id: string;
  facilityId: string;
  userId: string;
  createdBy: string | null;
  title: string;
  description: string | null;
  attendeeCount: number | null;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  approvalRequired: boolean;
  cancellationReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    code: string;
    name: string;
    slug: string;
    level: string;
    type: FacilityType;
  } | null;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  approvals: {
    id: string;
    status: ApprovalStatus;
    requestedBy: string;
    reviewedBy: string | null;
    requestedAt: string;
    reviewedAt: string | null;
    remarks: string | null;
  }[];
};

const adminBookingSelect = `
  id,
  facility_id,
  user_id,
  created_by,
  title,
  description,
  attendee_count,
  status,
  starts_at,
  ends_at,
  approval_required,
  cancellation_reason,
  cancelled_by,
  cancelled_at,
  created_at,
  updated_at,
  facilities (
    id,
    code,
    name,
    slug,
    level,
    type
  ),
  profiles!bookings_user_id_fkey (
    id,
    email,
    full_name
  ),
  booking_approvals (
    id,
    status,
    requested_by,
    reviewed_by,
    requested_at,
    reviewed_at,
    remarks
  )
`;

function mapAdminBooking(record: AdminBookingRecord): AdminBooking {
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
    createdBy: record.created_by,
    title: record.title,
    description: record.description,
    attendeeCount: record.attendee_count,
    status: record.status,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    approvalRequired: record.approval_required,
    cancellationReason: record.cancellation_reason,
    cancelledBy: record.cancelled_by,
    cancelledAt: record.cancelled_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    facility: facilityRecord
      ? {
          id: facilityRecord.id,
          code: facilityRecord.code,
          name: facilityRecord.name,
          slug: facilityRecord.slug,
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
    approvals: (record.booking_approvals ?? []).map((approval) => ({
      id: approval.id,
      status: approval.status,
      requestedBy: approval.requested_by,
      reviewedBy: approval.reviewed_by,
      requestedAt: approval.requested_at,
      reviewedAt: approval.reviewed_at,
      remarks: approval.remarks,
    })),
  };
}

export async function getAdminBookings(
  supabase: SupabaseClient,
  filters: AdminBookingFilters = {},
) {
  let query = supabase
    .from("bookings")
    .select(adminBookingSelect)
    .order("starts_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.facilityId) {
    query = query.eq("facility_id", filters.facilityId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load bookings.");
  }

  return ((data as unknown as AdminBookingRecord[] | null) ?? []).map(
    mapAdminBooking,
  );
}

export async function getAdminBookingById(
  supabase: SupabaseClient,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(adminBookingSelect)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load booking.");
  }

  return data ? mapAdminBooking(data as unknown as AdminBookingRecord) : null;
}

export async function getPendingApprovalBookings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("bookings")
    .select(adminBookingSelect)
    .eq("status", "pending")
    .eq("approval_required", true)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load pending approvals.");
  }

  return ((data as unknown as AdminBookingRecord[] | null) ?? []).map(
    mapAdminBooking,
  );
}
