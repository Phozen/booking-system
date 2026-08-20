import type { EmployeeCalendarBooking } from "@/lib/bookings/calendar-queries";
import { getInvitationContextLabel } from "@/lib/bookings/invitations/validation";
import type { CalendarBooking } from "@/lib/calendar/group-bookings";
import type { BookingRelationship } from "@/components/shared/booking-relationship-tokens";
import { getBookingRelationshipToken } from "@/components/shared/booking-relationship-tokens";

export function getEmployeeCalendarRelationship(
  booking: EmployeeCalendarBooking,
): BookingRelationship {
  if (booking.visibilityContext === "other") {
    return "other";
  }

  if (booking.visibilityContext === "invited" || booking.invitationStatus) {
    return "invited";
  }

  return "owned";
}

export function toEmployeeCalendarItem(
  booking: EmployeeCalendarBooking,
): CalendarBooking {
  const relationship = getEmployeeCalendarRelationship(booking);
  const isOther = relationship === "other";
  const contextLabel = isOther
    ? getBookingRelationshipToken("other").label
    : booking.invitationStatus
      ? getInvitationContextLabel(booking.invitationStatus)
      : getBookingRelationshipToken(relationship).label;
  const userLabel = isOther
    ? booking.user?.fullName?.trim() || undefined
    : booking.user?.fullName && booking.user.email
      ? `${booking.user.fullName} (${booking.user.email})`
      : booking.user?.email || booking.user?.fullName || undefined;

  return {
    id: booking.id,
    href: isOther ? undefined : `/bookings/${booking.id}`,
    title: isOther ? "Booked" : booking.title,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    facilityName: booking.facility?.name ?? "Room unavailable",
    facilityLevel: booking.facility?.level ?? "Level unavailable",
    approvalRequired: isOther ? undefined : booking.approvalRequired,
    userLabel,
    contextLabel,
    relationship,
    isManageable: relationship === "owned",
  };
}
