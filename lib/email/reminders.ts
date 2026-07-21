import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatBookingDateTime } from "@/lib/bookings/format";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBookingDepartmentSnapshot } from "@/lib/departments/notifications";

export type QueueDueBookingRemindersResult = {
  queued: number;
  skipped: number;
};

type ReminderBooking = {
  id: string;
  title: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  profiles:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
  facilities:
    | { name: string; level: string }
    | { name: string; level: string }[]
    | null;
};

function firstRecord<T>(record: T | T[] | null | undefined) {
  return Array.isArray(record) ? record[0] : record ?? null;
}

function reminderIdempotencyKey({
  bookingId,
  recipientEmail,
  offsetMinutes,
}: {
  bookingId: string;
  recipientEmail: string;
  offsetMinutes: number;
}) {
  return `booking-reminder:${bookingId}:${recipientEmail.toLowerCase()}:${offsetMinutes}`;
}

export async function queueDueBookingReminders(
  supabase: SupabaseClient = createAdminClient(),
  now = new Date(),
): Promise<QueueDueBookingRemindersResult> {
  const settings = await getAppSettings();
  const offsets = settings.reminderOffsetsMinutes;
  const maxOffset = Math.max(...offsets, 0);
  const horizon = new Date(now.getTime() + maxOffset * 60_000);
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id,title,user_id,starts_at,ends_at,profiles!bookings_user_id_fkey(email,full_name),facilities(name,level)",
    )
    .eq("status", "confirmed")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error("Confirmed bookings could not be loaded for reminders.");
  }

  let queued = 0;
  let skipped = 0;

  for (const booking of ((bookings as unknown as ReminderBooking[] | null) ?? [])) {
    const profile = firstRecord(booking.profiles);
    const facility = firstRecord(booking.facilities);
    const departments = await getBookingDepartmentSnapshot(booking.id).catch(
      (error) => {
        console.error("Booking department snapshot unavailable", {
          bookingId: booking.id,
          error,
        });
        return [];
      },
    );

    if (!profile?.email) {
      skipped += 1;
      continue;
    }

    const { data: preferences } = await supabase
      .from("user_notification_preferences")
      .select("booking_reminders_enabled")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    if (preferences?.booking_reminders_enabled === false) {
      skipped += 1;
      continue;
    }

    const startsAt = new Date(booking.starts_at);

    for (const offset of offsets) {
      const dueAt = new Date(startsAt.getTime() - offset * 60_000);

      if (dueAt > now) {
        continue;
      }

      const { error: insertError } = await supabase
        .from("email_notifications")
        .insert({
          type: "booking_reminder",
          status: "queued",
          recipient_email: profile.email,
          recipient_user_id: booking.user_id,
          subject: `Booking reminder: ${booking.title}`,
          body: `Reminder: ${booking.title} is scheduled for ${formatBookingDateTime(booking.starts_at)}.`,
          template_name: "booking_reminder",
          template_data: {
            bookingId: booking.id,
            title: booking.title,
            facilityName: facility?.name ?? null,
            facilityLevel: facility?.level ?? null,
            startsAt: booking.starts_at,
            endsAt: booking.ends_at,
            reminderOffsetMinutes: offset,
            departments,
          },
          related_booking_id: booking.id,
          scheduled_for: now.toISOString(),
          idempotency_key: reminderIdempotencyKey({
            bookingId: booking.id,
            recipientEmail: profile.email,
            offsetMinutes: offset,
          }),
        });

      if (insertError?.code === "23505") {
        skipped += 1;
      } else if (insertError) {
        throw new Error("A due booking reminder could not be queued.");
      } else {
        queued += 1;
      }
    }
  }

  return { queued, skipped };
}
