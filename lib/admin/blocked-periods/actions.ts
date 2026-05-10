"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  blockedPeriodFormSchema,
  formDataToBlockedPeriodValues,
  getFormDateTimeIso,
} from "@/lib/admin/blocked-periods/validation";

export type BlockedPeriodActionResult = {
  status: "idle" | "error" | "success";
  message: string;
  blockedPeriodId?: string;
};

type BlockedPeriodAuditRecord = {
  id: string;
  title: string;
  reason: string | null;
  scope: "all_facilities" | "selected_facilities";
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

function getFriendlyBlockedPeriodError() {
  return "Blocked period could not be saved. Check the details, then try again.";
}

function revalidateBlockedPeriodPaths(blockedPeriodId?: string) {
  revalidatePath("/admin/blocked-dates");

  if (blockedPeriodId) {
    revalidatePath(`/admin/blocked-dates/${blockedPeriodId}`);
  }

  revalidatePath("/bookings/new");
}

async function insertBlockedPeriodAuditLog({
  action,
  blockedPeriodId,
  actorUserId,
  actorEmail,
  summary,
  oldValues,
  newValues,
}: {
  action: "create" | "update";
  blockedPeriodId: string;
  actorUserId: string;
  actorEmail: string | undefined;
  summary: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await createAuditLogSafely(
    supabase,
    {
      action,
      entityType: "blocked_period",
      entityId: blockedPeriodId,
      actorUserId,
      actorEmail,
      summary,
      oldValues,
      newValues,
    },
    { blockedPeriodId },
  );
}

async function replaceBlockedPeriodFacilities(
  blockedPeriodId: string,
  facilityIds: string[],
) {
  const supabase = createAdminClient();
  const { error: deleteError } = await supabase
    .from("blocked_period_facilities")
    .delete()
    .eq("blocked_period_id", blockedPeriodId);

  if (deleteError) {
    return deleteError;
  }

  if (facilityIds.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase
    .from("blocked_period_facilities")
    .insert(
      facilityIds.map((facilityId) => ({
        blocked_period_id: blockedPeriodId,
        facility_id: facilityId,
      })),
    );

  return insertError;
}

export async function createBlockedPeriodAction(
  formData: FormData,
): Promise<BlockedPeriodActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = blockedPeriodFormSchema.safeParse(
    formDataToBlockedPeriodValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the blocked period details, then try again.",
    };
  }

  const startsAt = getFormDateTimeIso(parsed.data.startDate, parsed.data.startTime);
  const endsAt = getFormDateTimeIso(parsed.data.endDate, parsed.data.endTime);

  if (!startsAt || !endsAt) {
    return {
      status: "error",
      message: "Start and end times must be valid.",
    };
  }

  const payload = {
    title: parsed.data.title,
    reason: parsed.data.reason || null,
    scope: parsed.data.scope,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: parsed.data.isActive,
    created_by: user.id,
    updated_by: user.id,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blocked_periods")
    .insert(payload)
    .select("id,title,reason,scope,starts_at,ends_at,is_active")
    .single();

  if (error || !data) {
    console.error("Blocked period create failed", {
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: getFriendlyBlockedPeriodError(),
    };
  }

  const facilityError = await replaceBlockedPeriodFacilities(
    data.id,
    parsed.data.scope === "selected_facilities" ? parsed.data.facilityIds : [],
  );

  if (facilityError) {
    console.error("Blocked period facility mapping failed", {
      blockedPeriodId: data.id,
      message: facilityError.message,
    });

    return {
      status: "error",
      message: "Blocked period was created, but affected facilities could not be saved.",
      blockedPeriodId: data.id,
    };
  }

  await insertBlockedPeriodAuditLog({
    action: "create",
    blockedPeriodId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Created blocked period ${parsed.data.title}.`,
    newValues: {
      ...payload,
      facilityIds: parsed.data.facilityIds,
    },
  });

  revalidateBlockedPeriodPaths(data.id);

  return {
    status: "success",
    message:
      "Blocked period created. Affected facilities cannot be booked during this time while it is active.",
    blockedPeriodId: data.id,
  };
}

export async function updateBlockedPeriodAction(
  blockedPeriodId: string,
  formData: FormData,
): Promise<BlockedPeriodActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = blockedPeriodFormSchema.safeParse(
    formDataToBlockedPeriodValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the blocked period details, then try again.",
    };
  }

  const startsAt = getFormDateTimeIso(parsed.data.startDate, parsed.data.startTime);
  const endsAt = getFormDateTimeIso(parsed.data.endDate, parsed.data.endTime);

  if (!startsAt || !endsAt) {
    return {
      status: "error",
      message: "Start and end times must be valid.",
    };
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("blocked_periods")
    .select("id,title,reason,scope,starts_at,ends_at,is_active")
    .eq("id", blockedPeriodId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      status: "error",
      message: "Blocked period could not be found.",
    };
  }

  const payload = {
    title: parsed.data.title,
    reason: parsed.data.reason || null,
    scope: parsed.data.scope,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: parsed.data.isActive,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("blocked_periods")
    .update(payload)
    .eq("id", blockedPeriodId)
    .select("id,title,reason,scope,starts_at,ends_at,is_active")
    .maybeSingle();

  if (error || !data) {
    console.error("Blocked period update failed", {
      blockedPeriodId,
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: getFriendlyBlockedPeriodError(),
    };
  }

  const facilityError = await replaceBlockedPeriodFacilities(
    blockedPeriodId,
    parsed.data.scope === "selected_facilities" ? parsed.data.facilityIds : [],
  );

  if (facilityError) {
    console.error("Blocked period facility mapping update failed", {
      blockedPeriodId,
      message: facilityError.message,
    });

    return {
      status: "error",
      message: "Blocked period was updated, but affected facilities could not be saved.",
      blockedPeriodId,
    };
  }

  await insertBlockedPeriodAuditLog({
    action: "update",
    blockedPeriodId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Updated blocked period ${parsed.data.title}.`,
    oldValues: existing as BlockedPeriodAuditRecord,
    newValues: {
      ...payload,
      facilityIds: parsed.data.facilityIds,
    },
  });

  revalidateBlockedPeriodPaths(blockedPeriodId);

  return {
    status: "success",
    message:
      "Blocked period updated. Future availability checks will use the saved details.",
    blockedPeriodId,
  };
}

export async function deactivateBlockedPeriodAction(
  blockedPeriodId: string,
): Promise<BlockedPeriodActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("blocked_periods")
    .select("id,title,reason,scope,starts_at,ends_at,is_active")
    .eq("id", blockedPeriodId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      status: "error",
      message: "Blocked period could not be found.",
    };
  }

  if (!existing.is_active) {
    return {
      status: "error",
      message: "Blocked period is already inactive.",
    };
  }

  const { data, error } = await supabase
    .from("blocked_periods")
    .update({
      is_active: false,
      updated_by: user.id,
    })
    .eq("id", blockedPeriodId)
    .eq("is_active", true)
    .select("id,title,reason,scope,starts_at,ends_at,is_active")
    .maybeSingle();

  if (error || !data) {
    console.error("Blocked period deactivate failed", {
      blockedPeriodId,
      message: error?.message,
    });

    return {
      status: "error",
      message: "Blocked period could not be deactivated. Please refresh and try again.",
    };
  }

  await insertBlockedPeriodAuditLog({
    action: "update",
    blockedPeriodId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Deactivated blocked period ${existing.title}.`,
    oldValues: existing as BlockedPeriodAuditRecord,
    newValues: data as BlockedPeriodAuditRecord,
  });

  revalidateBlockedPeriodPaths(blockedPeriodId);

  return {
    status: "success",
    message:
      "Blocked period deactivated. It no longer prevents bookings for the affected facilities.",
    blockedPeriodId,
  };
}
