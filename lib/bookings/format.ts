import type { BookingStatus } from "@/lib/bookings/queries";

const appTimeZone = process.env.APP_TIMEZONE || "Asia/Kuala_Lumpur";

export function formatBookingStatus(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "Pending Approval",
    confirmed: "Confirmed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    completed: "Completed",
    expired: "Expired",
  };

  return labels[status];
}

export function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeZone: appTimeZone,
  }).format(new Date(value));
}

export function formatBookingTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: appTimeZone,
  }).format(new Date(value));
}

export function formatBookingDateTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: appTimeZone,
  }).format(new Date(value));
}

export function formatBookingWindow(startsAt: string, endsAt: string) {
  return `${formatBookingTime(startsAt)} - ${formatBookingTime(endsAt)}`;
}

export function isCancellableBooking(status: BookingStatus) {
  return status === "pending" || status === "confirmed";
}
