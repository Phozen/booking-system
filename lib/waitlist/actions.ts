"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { getAppSettings } from "@/lib/settings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  adminWaitlistUpdateSchema,
  formDataToAdminWaitlistValues,
  formDataToWaitlistValues,
  getWaitlistDateRange,
  waitlistRequestSchema,
} from "@/lib/waitlist/validation";

export type WaitlistActionResult = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createWaitlistRequestAction(
  _previousState: WaitlistActionResult,
  formData: FormData,
): Promise<WaitlistActionResult> {
  void _previousState;
  const { user, profile } = await requireUser();

  if (profile?.status !== "active") {
    return { status: "error", message: "Your account is not active." };
  }

  const parsed = waitlistRequestSchema.safeParse(
    formDataToWaitlistValues(formData),
  );

  if (!parsed.success) {
    return { status: "error", message: "Check the waitlist details, then try again." };
  }

  const settings = await getAppSettings();
  const range = getWaitlistDateRange(parsed.data, settings.defaultTimezone);

  if (!range.startsAt || !range.endsAt || range.message) {
    return { status: "error", message: range.message ?? "Choose a valid time." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_waitlist_requests")
    .insert({
      requester_id: user.id,
      facility_id: parsed.data.facilityId || null,
      requested_starts_at: range.startsAt.toISOString(),
      requested_ends_at: range.endsAt.toISOString(),
      attendee_count:
        parsed.data.attendeeCount === "" || parsed.data.attendeeCount == null
          ? null
          : parsed.data.attendeeCount,
      reason: `${parsed.data.title}${parsed.data.reason ? `\n\n${parsed.data.reason}` : ""}`,
      status: "open",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "Waitlist request could not be created." };
  }

  await createAuditLogSafely(createAdminClient(), {
    action: "create",
    entityType: "booking",
    entityId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: "Created waitlist / alternative request.",
    newValues: { waitlistRequestId: data.id },
  });

  revalidatePath("/waitlist");
  revalidatePath("/admin/waitlist");

  return { status: "success", message: "Waitlist / alternative request submitted." };
}

export async function cancelWaitlistRequestAction(
  requestId: string,
  _previousState: WaitlistActionResult,
  _formData: FormData,
): Promise<WaitlistActionResult> {
  void _previousState;
  void _formData;
  const { user } = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_waitlist_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("requester_id", user.id)
    .in("status", ["open", "suggested_alternative"]);

  if (error) {
    return { status: "error", message: "Waitlist request could not be cancelled." };
  }

  revalidatePath("/waitlist");
  revalidatePath("/admin/waitlist");

  return { status: "success", message: "Waitlist request cancelled." };
}

export async function updateAdminWaitlistRequestAction(
  requestId: string,
  _previousState: WaitlistActionResult,
  formData: FormData,
): Promise<WaitlistActionResult> {
  void _previousState;
  const { user } = await requireAdmin();
  const parsed = adminWaitlistUpdateSchema.safeParse(
    formDataToAdminWaitlistValues(formData),
  );

  if (!parsed.success) {
    return { status: "error", message: "Check the waitlist response." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("booking_waitlist_requests")
    .select("id,status,admin_response")
    .eq("id", requestId)
    .maybeSingle();

  if (!existing) {
    return { status: "error", message: "Waitlist request could not be found." };
  }

  const updateValues = {
    status: parsed.data.status,
    admin_response: parsed.data.adminResponse || null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("booking_waitlist_requests")
    .update(updateValues)
    .eq("id", requestId);

  if (error) {
    return { status: "error", message: "Waitlist request could not be updated." };
  }

  await createAuditLogSafely(supabase, {
    action: "update",
    entityType: "booking",
    entityId: requestId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: "Updated waitlist / alternative request.",
    oldValues: existing,
    newValues: updateValues,
  });

  revalidatePath("/waitlist");
  revalidatePath("/admin/waitlist");

  return { status: "success", message: "Waitlist request updated." };
}
