"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import {
  getFormDateTimeIso,
} from "@/lib/admin/blocked-periods/validation";
import {
  formDataToMaintenanceClosureValues,
  maintenanceClosureFormSchema,
  type MaintenanceStatus,
} from "@/lib/admin/maintenance/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export type MaintenanceClosureActionResult = {
  status: "idle" | "error" | "success";
  message: string;
  maintenanceClosureId?: string;
};

type MaintenanceAuditRecord = {
  id: string;
  facility_id: string;
  title: string;
  reason: string | null;
  status: MaintenanceStatus;
  starts_at: string;
  ends_at: string;
  completed_by: string | null;
  completed_at: string | null;
};

function revalidateMaintenancePaths(maintenanceClosureId?: string) {
  revalidatePath("/admin/maintenance");

  if (maintenanceClosureId) {
    revalidatePath(`/admin/maintenance/${maintenanceClosureId}`);
  }

  revalidatePath("/bookings/new");
}

function getFriendlyMaintenanceError() {
  return "Maintenance closure could not be saved. Check the details, then try again.";
}

async function insertMaintenanceAuditLog({
  action,
  maintenanceClosureId,
  actorUserId,
  actorEmail,
  summary,
  oldValues,
  newValues,
}: {
  action: "create" | "update" | "cancel";
  maintenanceClosureId: string;
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
      entityType: "maintenance_closure",
      entityId: maintenanceClosureId,
      actorUserId,
      actorEmail,
      summary,
      oldValues,
      newValues,
    },
    { maintenanceClosureId },
  );
}

async function getMaintenanceAuditRecord(maintenanceClosureId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_closures")
    .select(
      "id,facility_id,title,reason,status,starts_at,ends_at,completed_by,completed_at",
    )
    .eq("id", maintenanceClosureId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as MaintenanceAuditRecord;
}

export async function createMaintenanceClosureAction(
  formData: FormData,
): Promise<MaintenanceClosureActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = maintenanceClosureFormSchema.safeParse(
    formDataToMaintenanceClosureValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the maintenance closure details, then try again.",
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
    facility_id: parsed.data.facilityId,
    title: parsed.data.title,
    reason: parsed.data.reason || null,
    status: "scheduled" as MaintenanceStatus,
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: user.id,
    updated_by: user.id,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_closures")
    .insert(payload)
    .select(
      "id,facility_id,title,reason,status,starts_at,ends_at,completed_by,completed_at",
    )
    .single();

  if (error || !data) {
    console.error("Maintenance closure create failed", {
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: getFriendlyMaintenanceError(),
    };
  }

  await insertMaintenanceAuditLog({
    action: "create",
    maintenanceClosureId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Created maintenance closure ${parsed.data.title}.`,
    newValues: data as MaintenanceAuditRecord,
  });

  revalidateMaintenancePaths(data.id);

  return {
    status: "success",
    message:
      "Maintenance closure created. The selected facility cannot be booked during this window while the closure is scheduled or in progress.",
    maintenanceClosureId: data.id,
  };
}

export async function updateMaintenanceClosureAction(
  maintenanceClosureId: string,
  formData: FormData,
): Promise<MaintenanceClosureActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = maintenanceClosureFormSchema.safeParse(
    formDataToMaintenanceClosureValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the maintenance closure details, then try again.",
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

  const existing = await getMaintenanceAuditRecord(maintenanceClosureId);

  if (!existing) {
    return {
      status: "error",
      message: "Maintenance closure could not be found.",
    };
  }

  const payload = {
    facility_id: parsed.data.facilityId,
    title: parsed.data.title,
    reason: parsed.data.reason || null,
    status: parsed.data.status,
    starts_at: startsAt,
    ends_at: endsAt,
    updated_by: user.id,
    completed_by:
      parsed.data.status === "completed"
        ? existing.completed_by ?? user.id
        : existing.completed_by,
    completed_at:
      parsed.data.status === "completed"
        ? existing.completed_at ?? new Date().toISOString()
        : existing.completed_at,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_closures")
    .update(payload)
    .eq("id", maintenanceClosureId)
    .select(
      "id,facility_id,title,reason,status,starts_at,ends_at,completed_by,completed_at",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Maintenance closure update failed", {
      maintenanceClosureId,
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: getFriendlyMaintenanceError(),
    };
  }

  await insertMaintenanceAuditLog({
    action: "update",
    maintenanceClosureId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Updated maintenance closure ${parsed.data.title}.`,
    oldValues: existing,
    newValues: data as MaintenanceAuditRecord,
  });

  revalidateMaintenancePaths(maintenanceClosureId);

  return {
    status: "success",
    message:
      "Maintenance closure updated. Future availability checks will use the saved details.",
    maintenanceClosureId,
  };
}

export async function completeMaintenanceClosureAction(
  maintenanceClosureId: string,
): Promise<MaintenanceClosureActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const existing = await getMaintenanceAuditRecord(maintenanceClosureId);

  if (!existing) {
    return {
      status: "error",
      message: "Maintenance closure could not be found.",
    };
  }

  if (existing.status === "completed") {
    return {
      status: "error",
      message: "Maintenance closure is already completed.",
    };
  }

  if (existing.status === "cancelled") {
    return {
      status: "error",
      message: "Cancelled maintenance closures cannot be completed.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_closures")
    .update({
      status: "completed",
      completed_by: user.id,
      completed_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", maintenanceClosureId)
    .in("status", ["scheduled", "in_progress"])
    .select(
      "id,facility_id,title,reason,status,starts_at,ends_at,completed_by,completed_at",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Maintenance closure completion failed", {
      maintenanceClosureId,
      message: error?.message,
    });

    return {
      status: "error",
      message: "Maintenance closure could not be completed. Please refresh and try again.",
    };
  }

  await insertMaintenanceAuditLog({
    action: "update",
    maintenanceClosureId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Completed maintenance closure ${existing.title}.`,
    oldValues: existing,
    newValues: data as MaintenanceAuditRecord,
  });

  revalidateMaintenancePaths(maintenanceClosureId);

  return {
    status: "success",
    message:
      "Maintenance closure completed. It no longer blocks future bookings.",
    maintenanceClosureId,
  };
}

export async function cancelMaintenanceClosureAction(
  maintenanceClosureId: string,
): Promise<MaintenanceClosureActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const existing = await getMaintenanceAuditRecord(maintenanceClosureId);

  if (!existing) {
    return {
      status: "error",
      message: "Maintenance closure could not be found.",
    };
  }

  if (existing.status === "cancelled") {
    return {
      status: "error",
      message: "Maintenance closure is already cancelled.",
    };
  }

  if (existing.status === "completed") {
    return {
      status: "error",
      message: "Completed maintenance closures cannot be cancelled.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_closures")
    .update({
      status: "cancelled",
      updated_by: user.id,
    })
    .eq("id", maintenanceClosureId)
    .in("status", ["scheduled", "in_progress"])
    .select(
      "id,facility_id,title,reason,status,starts_at,ends_at,completed_by,completed_at",
    )
    .maybeSingle();

  if (error || !data) {
    console.error("Maintenance closure cancellation failed", {
      maintenanceClosureId,
      message: error?.message,
    });

    return {
      status: "error",
      message: "Maintenance closure could not be cancelled. Please refresh and try again.",
    };
  }

  await insertMaintenanceAuditLog({
    action: "cancel",
    maintenanceClosureId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Cancelled maintenance closure ${existing.title}.`,
    oldValues: existing,
    newValues: data as MaintenanceAuditRecord,
  });

  revalidateMaintenancePaths(maintenanceClosureId);

  return {
    status: "success",
    message: "Maintenance closure cancelled. It no longer blocks bookings.",
    maintenanceClosureId,
  };
}
