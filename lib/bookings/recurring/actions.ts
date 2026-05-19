"use server";

import { revalidatePath } from "next/cache";

import { createAuditLogSafely } from "@/lib/audit/log";
import { requireUser } from "@/lib/auth/guards";
import { checkBookingAvailability } from "@/lib/bookings/availability";
import { normalizeAttendeeCount } from "@/lib/bookings/validation";
import { getEffectiveApprovalRequired, getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncConfirmedBookingToMicrosoftCalendar } from "@/lib/integrations/microsoft-365-calendar/sync";
import { generateRecurrenceOccurrences } from "@/lib/bookings/recurring/occurrences";
import {
  formDataToRecurrenceValues,
  getOccurrenceDateRange,
  recurrenceFormSchema,
} from "@/lib/bookings/recurring/validation";

export type RecurringOccurrencePreview = {
  sequence: number;
  date: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
  message: string;
};

export type RecurringBookingActionResult = {
  status: "idle" | "error" | "success";
  message: string;
  occurrences?: RecurringOccurrencePreview[];
  createdCount?: number;
};

async function syncConfirmedBookingSafely(bookingId: string) {
  try {
    await syncConfirmedBookingToMicrosoftCalendar(bookingId);
  } catch (error) {
    console.error("Recurring booking calendar sync unavailable", {
      bookingId,
      error,
    });
  }
}

async function buildOccurrencePreview(formData: FormData) {
  const parsed = recurrenceFormSchema.safeParse(formDataToRecurrenceValues(formData));

  if (!parsed.success) {
    return {
      error: "Check the recurring booking details, then try again.",
      parsed: null,
      occurrences: [],
    };
  }

  const settings = await getAppSettings();
  const occurrences = generateRecurrenceOccurrences({
    startsOn: parsed.data.date,
    frequency: parsed.data.frequency,
    intervalCount: parsed.data.intervalCount,
    endsOn: parsed.data.endsOn || null,
    occurrenceCount:
      parsed.data.occurrenceCount === "" || parsed.data.occurrenceCount == null
        ? null
        : parsed.data.occurrenceCount,
    maxOccurrences: 50,
  });

  if (occurrences.length === 0) {
    return {
      error: "Add an end date or occurrence count that creates at least one occurrence.",
      parsed,
      occurrences: [],
    };
  }

  const supabase = await createClient();
  const attendeeCount = normalizeAttendeeCount(parsed.data.attendeeCount);
  const preview: RecurringOccurrencePreview[] = [];

  for (const occurrence of occurrences) {
    const range = getOccurrenceDateRange(
      {
        date: occurrence.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      },
      settings.defaultTimezone,
    );

    if (!range.startsAt || !range.endsAt || range.message) {
      preview.push({
        ...occurrence,
        startsAt: "",
        endsAt: "",
        available: false,
        message: range.message ?? "Choose a valid time.",
      });
      continue;
    }

    const availability = await checkBookingAvailability(supabase, {
      facilityId: parsed.data.facilityId,
      startsAt: range.startsAt,
      endsAt: range.endsAt,
      attendeeCount,
    });

    preview.push({
      ...occurrence,
      startsAt: range.startsAt.toISOString(),
      endsAt: range.endsAt.toISOString(),
      available: availability.available,
      message: availability.available ? "Available" : availability.message,
    });
  }

  return { error: null, parsed, occurrences: preview };
}

export async function previewRecurringBookingAction(
  _previousState: RecurringBookingActionResult,
  formData: FormData,
): Promise<RecurringBookingActionResult> {
  void _previousState;
  const { profile } = await requireUser();

  if (profile.status !== "active") {
    return { status: "error", message: "Your account is not active." };
  }

  const preview = await buildOccurrencePreview(formData);

  if (preview.error) {
    return { status: "error", message: preview.error };
  }

  const availableCount = preview.occurrences.filter((occurrence) => occurrence.available).length;

  return {
    status: "success",
    message: `${availableCount} of ${preview.occurrences.length} occurrences are available.`,
    occurrences: preview.occurrences,
  };
}

export async function createRecurringBookingsAction(
  _previousState: RecurringBookingActionResult,
  formData: FormData,
): Promise<RecurringBookingActionResult> {
  void _previousState;
  const { user, profile } = await requireUser();

  if (profile.status !== "active") {
    return { status: "error", message: "Your account is not active." };
  }

  const preview = await buildOccurrencePreview(formData);

  if (preview.error || !preview.parsed?.success) {
    return { status: "error", message: preview.error ?? "Check the recurring booking details." };
  }

  const available = preview.occurrences.filter((occurrence) => occurrence.available);

  if (available.length === 0) {
    return { status: "error", message: "No generated occurrences are available." };
  }

  const parsed = preview.parsed.data;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const settings = await getAppSettings();
  const attendeeCount = normalizeAttendeeCount(parsed.attendeeCount);
  const firstAvailability = await checkBookingAvailability(supabase, {
    facilityId: parsed.facilityId,
    startsAt: new Date(available[0].startsAt),
    endsAt: new Date(available[0].endsAt),
    attendeeCount,
  });

  if (!firstAvailability.available) {
    return { status: "error", message: firstAvailability.message };
  }

  const approvalRequired = getEffectiveApprovalRequired(
    firstAvailability.facility.requiresApproval,
    settings,
  );
  const { data: series, error: seriesError } = await supabase
    .from("booking_recurrence_series")
    .insert({
      owner_user_id: user.id,
      facility_id: parsed.facilityId,
      title: parsed.title,
      description: parsed.description || null,
      frequency: parsed.frequency,
      interval_count: parsed.intervalCount,
      starts_on: parsed.date,
      ends_on: parsed.endsOn || null,
      occurrence_count:
        parsed.occurrenceCount === "" || parsed.occurrenceCount == null
          ? available.length
          : parsed.occurrenceCount,
      created_by: user.id,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (seriesError || !series) {
    return { status: "error", message: "Recurring series could not be created." };
  }

  const createdBookingIds: string[] = [];

  for (const occurrence of available) {
    const { data, error } = await supabase.rpc("create_booking", {
      p_facility_id: parsed.facilityId,
      p_user_id: user.id,
      p_created_by: user.id,
      p_title: parsed.title,
      p_description: parsed.description || null,
      p_attendee_count: attendeeCount,
      p_starts_at: occurrence.startsAt,
      p_ends_at: occurrence.endsAt,
      p_approval_required: approvalRequired,
      p_catering_required: false,
      p_catering_type: null,
      p_catering_pax: null,
      p_catering_serving_time: null,
      p_catering_dietary_notes: null,
      p_catering_notes: null,
    });

    if (error || !data) {
      continue;
    }

    const booking = data as { id: string; status: "pending" | "confirmed" };
    await supabase
      .from("bookings")
      .update({
        recurrence_series_id: series.id,
        recurrence_sequence: occurrence.sequence,
      })
      .eq("id", booking.id);
    createdBookingIds.push(booking.id);

    if (booking.status === "confirmed") {
      await syncConfirmedBookingSafely(booking.id);
    }
  }

  await createAuditLogSafely(
    adminSupabase,
    {
      action: "create",
      entityType: "booking",
      entityId: series.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Created recurring booking series ${parsed.title}.`,
      newValues: {
        seriesId: series.id,
        createdBookingIds,
        skippedConflicts: preview.occurrences.length - available.length,
      },
    },
    { bookingId: createdBookingIds[0] },
  );

  revalidatePath("/dashboard");
  revalidatePath("/my-bookings");
  revalidatePath("/calendar");
  revalidatePath("/bookings/recurring/new");

  return {
    status: "success",
    message: `Created ${createdBookingIds.length} recurring booking occurrence${createdBookingIds.length === 1 ? "" : "s"}. Conflicting occurrences were skipped.`,
    occurrences: preview.occurrences,
    createdCount: createdBookingIds.length,
  };
}
