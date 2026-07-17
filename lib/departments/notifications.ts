import { formatBookingDateTime } from "@/lib/bookings/format";
import { createAdminClient } from "@/lib/supabase/admin";

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
  kind: "confirmation" | "cancellation";
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
      departments: { name: string; email: string } | { name: string; email: string }[] | null;
    }[]).flatMap((row) => Array.isArray(row.departments) ? row.departments : row.departments ? [row.departments] : []);
    if (departments.length === 0) return;
    const window = `${formatBookingDateTime(startsAt)} to ${formatBookingDateTime(endsAt)}`;

    await supabase.from("email_notifications").insert(departments.map((department) => ({
      type: kind === "confirmation" ? "booking_confirmation" : "booking_cancellation",
      status: "queued",
      recipient_email: department.email,
      subject: `${kind === "confirmation" ? "Booking confirmed" : "Booking cancelled"}: ${title}`,
      body: kind === "confirmation"
        ? `${department.name} is tagged on ${title} at ${facilityName}, ${window}.`
        : `${title} at ${facilityName}, ${window}, has been cancelled.`,
      template_name: `department_booking_${kind}`,
      template_data: { bookingId, departmentName: department.name, title, facilityName, startsAt, endsAt },
      related_booking_id: bookingId,
      idempotency_key: `department-booking-${kind}:${bookingId}:${department.email}`,
    })));
  } catch (error) {
    console.error("Department booking notification unavailable", { bookingId, kind, error });
  }
}
