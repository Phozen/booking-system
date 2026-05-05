import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Facility } from "@/lib/facilities/queries";
import { getBookableFacilities } from "@/lib/bookings/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export type AvailabilityFailureReason =
  | "invalid_time"
  | "facility_unavailable"
  | "capacity_exceeded"
  | "booking_conflict"
  | "blocked_period"
  | "maintenance_closure"
  | "unknown";

export type AvailabilityResult =
  | {
      available: true;
      facility: Facility;
    }
  | {
      available: false;
      reason: AvailabilityFailureReason;
      message: string;
    };

type AvailabilityInput = {
  facilityId: string;
  startsAt: Date;
  endsAt: Date;
  attendeeCount: number | null;
};

export async function checkBookingAvailability(
  supabase: SupabaseClient,
  input: AvailabilityInput,
): Promise<AvailabilityResult> {
  if (input.startsAt >= input.endsAt) {
    return {
      available: false,
      reason: "invalid_time",
      message: "Start time must be before end time.",
    };
  }

  const facilities = await getBookableFacilities(supabase);
  const facility = facilities.find((item) => item.id === input.facilityId);

  if (!facility || facility.status !== "active" || facility.isArchived) {
    return {
      available: false,
      reason: "facility_unavailable",
      message: "This facility is not available for booking.",
    };
  }

  if (
    input.attendeeCount !== null &&
    input.attendeeCount > facility.capacity
  ) {
    return {
      available: false,
      reason: "capacity_exceeded",
      message: `Attendee count exceeds the facility capacity of ${facility.capacity}.`,
    };
  }

  const startsAt = input.startsAt.toISOString();
  const endsAt = input.endsAt.toISOString();
  // Use a server-only client for conflict checks so RLS does not hide other
  // users' bookings from the availability decision.
  const availabilityClient = createAdminClient();

  const { data: bookingConflicts, error: bookingError } = await availabilityClient
    .from("bookings")
    .select("id")
    .eq("facility_id", input.facilityId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (bookingError) {
    console.error("Booking availability lookup failed", {
      message: bookingError.message,
    });
    return {
      available: false,
      reason: "unknown",
      message: "Availability could not be checked. Please try again.",
    };
  }

  if ((bookingConflicts?.length ?? 0) > 0) {
    return {
      available: false,
      reason: "booking_conflict",
      message:
        "This facility is already booked for the selected time. Please choose another time or facility.",
    };
  }

  const { data: blockedPeriods, error: blockedError } = await availabilityClient
    .from("blocked_periods")
    .select(
      "id,scope,blocked_period_facilities(facility_id)",
    )
    .eq("is_active", true)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if (blockedError) {
    console.error("Blocked period availability lookup failed", {
      message: blockedError.message,
    });
    return {
      available: false,
      reason: "unknown",
      message: "Availability could not be checked. Please try again.",
    };
  }

  const hasBlockedPeriod = (blockedPeriods ?? []).some((period) => {
    if (period.scope === "all_facilities") {
      return true;
    }

    const facilitiesForPeriod = Array.isArray(period.blocked_period_facilities)
      ? period.blocked_period_facilities
      : [];

    return facilitiesForPeriod.some(
      (blockedFacility) => blockedFacility.facility_id === input.facilityId,
    );
  });

  if (hasBlockedPeriod) {
    return {
      available: false,
      reason: "blocked_period",
      message:
        "This facility is unavailable during the selected time due to a blocked period.",
    };
  }

  const { data: maintenanceClosures, error: maintenanceError } = await availabilityClient
    .from("maintenance_closures")
    .select("id")
    .eq("facility_id", input.facilityId)
    .in("status", ["scheduled", "in_progress"])
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (maintenanceError) {
    console.error("Maintenance availability lookup failed", {
      message: maintenanceError.message,
    });
    return {
      available: false,
      reason: "unknown",
      message: "Availability could not be checked. Please try again.",
    };
  }

  if ((maintenanceClosures?.length ?? 0) > 0) {
    return {
      available: false,
      reason: "maintenance_closure",
      message: "This facility is under maintenance during the selected time.",
    };
  }

  return {
    available: true,
    facility,
  };
}
