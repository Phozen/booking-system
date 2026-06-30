type BookingErrorContext = "owner" | "admin-create";

export function getFriendlyBookingError(
  error: { code?: string; message?: string },
  context: BookingErrorContext = "owner",
) {
  const message = error.message?.toLowerCase() ?? "";

  if (
    error.code === "23P01" ||
    message.includes("bookings_no_overlapping_active") ||
    message.includes("exclusion constraint")
  ) {
    return "This time slot is no longer available. Please choose another time.";
  }

  if (
    message.includes("only cancel") ||
    message.includes("can no longer be edited") ||
    message.includes("can no longer be cancelled")
  ) {
    return "This booking can no longer be changed.";
  }

  if (
    message.includes("own booking") ||
    message.includes("own bookings") ||
    message.includes("permission")
  ) {
    return "You do not have permission to change this booking.";
  }

  if (message.includes("booking not found")) {
    return "Booking could not be found.";
  }

  if (message.includes("blocked")) {
    return "This facility is unavailable during the selected time due to a blocked period.";
  }

  if (message.includes("maintenance")) {
    return "This facility is under maintenance during the selected time.";
  }

  if (message.includes("not available") || message.includes("not found")) {
    return "This facility is not available for booking.";
  }

  if (message.includes("attendee")) {
    return "Attendee count exceeds the facility capacity.";
  }

  if (message.includes("only active admins")) {
    return "Only active admins can create bookings for another user.";
  }

  if (context === "admin-create" && message.includes("booking user is not active")) {
    return "Only active users can own admin-created bookings.";
  }

  if (message.includes("active user") || message.includes("account is not active")) {
    return "Your account is not active for booking.";
  }

  if (message.includes("start time")) {
    return "Start time must be before end time.";
  }

  return "Booking could not be saved. Please check the details and try again.";
}
