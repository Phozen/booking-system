"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { queueDepartmentBookingNotification } from "@/lib/departments/notifications";
import { createAppNotification } from "@/lib/notifications/app-notifications";
import { cancelMicrosoftCalendarEventForBooking } from "@/lib/integrations/microsoft-365-calendar/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function retireRecurringBookingsAction(formData: FormData) {
  const { user, profile } = await requireSuperAdmin();
  if (!user || profile?.status !== "active") throw new Error("Active Super Admin access required.");
  if (formData.get("confirmRetirement") !== "yes") throw new Error("Confirm recurring booking retirement first.");

  const admin = createAdminClient();
  const { data: rows, error: lookupError } = await admin
    .from("bookings")
    .select("id,title,status,starts_at,ends_at,facilities(name),profiles!bookings_user_id_fkey(id,email)")
    .not("recurrence_series_id", "is", null)
    .gt("starts_at", new Date().toISOString())
    .in("status", ["pending", "confirmed"]);
  if (lookupError) throw new Error("Unable to find future recurring bookings.");

  const client = await createClient();
  const { data: retired, error } = await client.rpc("retire_future_recurring_bookings");
  if (error) throw new Error("Recurring booking retirement could not be completed.");
  const retiredIds = new Set(((retired ?? []) as { booking_id: string }[]).map((item) => item.booking_id));

  for (const row of (rows ?? []) as {
    id: string; title: string; status: "pending" | "confirmed"; starts_at: string; ends_at: string;
    facilities: { name: string } | { name: string }[] | null;
    profiles: { id: string; email: string } | { id: string; email: string }[] | null;
  }[]) {
    if (!retiredIds.has(row.id)) continue;
    const facility = Array.isArray(row.facilities) ? row.facilities[0] : row.facilities;
    const owner = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    await createAuditLogSafely(admin, {
      action: "cancel", entityType: "booking", entityId: row.id, actorUserId: user.id, actorEmail: user.email,
      summary: `Retired recurring booking ${row.title}.`, newValues: { status: "cancelled", reason: "Recurring booking feature retired." },
    }, { bookingId: row.id });
    if (owner?.email) {
      await admin.from("email_notifications").insert({
        type: "booking_cancellation", status: "queued", recipient_email: owner.email,
        subject: `Booking cancelled: ${row.title}`,
        body: `Your future recurring booking for ${facility?.name ?? "the facility"} has been cancelled because recurring bookings were retired.`,
        template_name: "booking_cancellation", template_data: { bookingId: row.id, title: row.title, startsAt: row.starts_at, endsAt: row.ends_at }, related_booking_id: row.id,
      });
    }
    if (owner?.id) {
      await createAppNotification({
        userId: owner.id,
        type: "booking_cancellation",
        title: `Booking cancelled: ${row.title}`,
        body: "Your future recurring booking was cancelled because recurring bookings were retired.",
        href: `/bookings/${row.id}`,
        relatedBookingId: row.id,
      });
    }
    if (row.status === "confirmed") {
      await queueDepartmentBookingNotification({ bookingId: row.id, title: row.title, facilityName: facility?.name ?? "the facility", startsAt: row.starts_at, endsAt: row.ends_at, kind: "cancellation" });
      try { await cancelMicrosoftCalendarEventForBooking(row.id, { userId: user.id, email: user.email }); } catch (cause) { console.error("Recurring retirement calendar cancellation failed", { bookingId: row.id, cause }); }
    }
  }
  revalidatePath("/admin/bookings"); revalidatePath("/admin/approvals"); revalidatePath("/calendar"); revalidatePath("/my-bookings");
}
