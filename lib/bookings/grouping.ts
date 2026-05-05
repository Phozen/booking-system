import type { EmployeeBooking } from "@/lib/bookings/queries";

export type GroupedEmployeeBookings = {
  pending: EmployeeBooking[];
  upcoming: EmployeeBooking[];
  history: EmployeeBooking[];
  cancelled: EmployeeBooking[];
};

export function groupEmployeeBookings(
  bookings: EmployeeBooking[],
): GroupedEmployeeBookings {
  const now = Date.now();

  return {
    pending: bookings.filter((booking) => booking.status === "pending"),
    upcoming: bookings.filter(
      (booking) =>
        booking.status === "confirmed" &&
        new Date(booking.endsAt).getTime() >= now,
    ),
    history: bookings.filter((booking) => {
      if (booking.status === "pending" || booking.status === "cancelled") {
        return false;
      }

      return (
        new Date(booking.endsAt).getTime() < now ||
        booking.status === "rejected" ||
        booking.status === "completed" ||
        booking.status === "expired"
      );
    }),
    cancelled: bookings.filter((booking) => booking.status === "cancelled"),
  };
}
