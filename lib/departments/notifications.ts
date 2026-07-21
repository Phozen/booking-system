import { formatBookingDateTime } from "@/lib/bookings/format";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingDepartmentSnapshot = {
  name: string;
  email: string;
};

export async function getBookingDepartmentSnapshot(bookingId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_departments")
    .select("departments(name,email)")
    .eq("booking_id", bookingId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as {
    departments:
      | BookingDepartmentSnapshot
      | BookingDepartmentSnapshot[]
      | null;
  }[]).flatMap((row) =>
    Array.isArray(row.departments)
      ? row.departments
      : row.departments
        ? [row.departments]
        : [],
  );
}

export async function queueDepartmentBookingNotification({
  bookingId,
  title,
  facilityName,
  startsAt,
  endsAt,
  kind,
  departmentIds,
}: {
  bookingId: string;
  title: string;
  facilityName: string;
  startsAt: string;
  endsAt: string;
  kind: "confirmation" | "approval" | "rejection" | "cancellation";
  departmentIds?: string[];
}) {
  if (departmentIds && departmentIds.length === 0) return;
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("booking_departments")
      .select("departments(name,email)")
      .eq("booking_id", bookingId);
    if (departmentIds) query = query.in("department_id", departmentIds);
    const { data, error } = await query;
    if (error) throw error;
    const departments = ((data ?? []) as {
      departments:
        | BookingDepartmentSnapshot
        | BookingDepartmentSnapshot[]
        | null;
    }[]).flatMap((row) =>
      Array.isArray(row.departments)
        ? row.departments
        : row.departments
          ? [row.departments]
          : [],
    );
    if (departments.length === 0) return;
    const window = `${formatBookingDateTime(startsAt)} to ${formatBookingDateTime(endsAt)}`;

    const notification = {
      confirmation: {
        type: "booking_confirmation" as const,
        subject: `Booking confirmed: ${title}`,
        body: (department: BookingDepartmentSnapshot) =>
          `${department.name} is tagged on ${title} at ${facilityName}, ${window}.`,
      },
      approval: {
        type: "booking_approval" as const,
        subject: `Booking approved: ${title}`,
        body: (department: BookingDepartmentSnapshot) =>
          `${title} at ${facilityName}, ${window}, has been approved. ${department.name} is tagged on this booking.`,
      },
      rejection: {
        type: "booking_rejection" as const,
        subject: `Booking rejected: ${title}`,
        body: (department: BookingDepartmentSnapshot) =>
          `${title} at ${facilityName}, ${window}, has been rejected. ${department.name} was tagged on this booking.`,
      },
      cancellation: {
        type: "booking_cancellation" as const,
        subject: `Booking cancelled: ${title}`,
        body: () =>
          `${title} at ${facilityName}, ${window}, has been cancelled.`,
      },
    }[kind];

    await supabase.from("email_notifications").insert(departments.map((department) => ({
      type: notification.type,
      status: "queued",
      recipient_email: department.email,
      subject: notification.subject,
      body: notification.body(department),
      template_name: `department_booking_${kind}`,
      template_data: {
        bookingId,
        departments,
        departmentName: department.name,
        title,
        facilityName,
        startsAt,
        endsAt,
      },
      related_booking_id: bookingId,
      idempotency_key: `department-booking-${kind}:${bookingId}:${department.email}`,
    })));
  } catch (error) {
    console.error("Department booking notification unavailable", { bookingId, kind, error });
  }
}
