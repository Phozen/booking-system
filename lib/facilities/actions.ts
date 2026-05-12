"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import {
  facilityFormSchema,
  getOptionalFormValue,
  parseRequiresApproval,
} from "@/lib/facilities/validation";
import type { FacilityActionResult } from "@/lib/facilities/action-types";
import { createClient } from "@/lib/supabase/server";

function getFriendlyFacilityError() {
  return "Facility could not be saved. Check for duplicate codes or slugs, then try again.";
}

function getFriendlyFacilityArchiveError() {
  return "Facility could not be archived. Please reload the page and try again.";
}

function logFacilityArchiveError({
  stage,
  facilityId,
  error,
}: {
  stage: string;
  facilityId?: string;
  error: unknown;
}) {
  console.error("Facility archive failed", {
    stage,
    facilityId,
    name: error instanceof Error ? error.name : undefined,
    message: error instanceof Error ? error.message : String(error),
  });
}

function formDataToValues(formData: FormData) {
  return {
    code: getOptionalFormValue(formData, "code"),
    name: getOptionalFormValue(formData, "name"),
    slug: getOptionalFormValue(formData, "slug"),
    level: getOptionalFormValue(formData, "level"),
    type: getOptionalFormValue(formData, "type"),
    capacity: getOptionalFormValue(formData, "capacity"),
    description: getOptionalFormValue(formData, "description"),
    status: getOptionalFormValue(formData, "status"),
    requiresApproval: getOptionalFormValue(formData, "requiresApproval"),
  };
}

async function insertAuditLog({
  action,
  facilityId,
  actorUserId,
  actorEmail,
  summary,
  oldValues,
  newValues,
}: {
  action: "create" | "update";
  facilityId: string;
  actorUserId: string;
  actorEmail: string | undefined;
  summary: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await createAuditLogSafely(
    supabase,
    {
      action,
      entityType: "facility",
      entityId: facilityId,
      actorUserId,
      actorEmail,
      summary,
      oldValues,
      newValues,
    },
    { facilityId },
  );
}

export async function createFacilityAction(
  formData: FormData,
): Promise<FacilityActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = facilityFormSchema.safeParse(formDataToValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the facility details, then try again.",
    };
  }

  const supabase = await createClient();
  const facilityPayload = {
    code: parsed.data.code,
    name: parsed.data.name,
    slug: parsed.data.slug,
    level: parsed.data.level,
    type: parsed.data.type,
    capacity: parsed.data.capacity,
    description: parsed.data.description || null,
    status: parsed.data.status,
    requires_approval: parseRequiresApproval(parsed.data.requiresApproval),
    display_order: 0,
    is_archived: parsed.data.status === "archived",
    created_by: user.id,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("facilities")
    .insert(facilityPayload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Facility create failed", {
      code: error?.code,
      message: error?.message,
    });

    return {
      status: "error",
      message: getFriendlyFacilityError(),
    };
  }

  await insertAuditLog({
    action: "create",
    facilityId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Created facility ${parsed.data.code}.`,
    newValues: facilityPayload,
  });

  revalidatePath("/facilities");
  revalidatePath("/admin/facilities");

  return {
    status: "success",
    message: "Facility created. Active facilities are available to employees.",
    facilityId: data.id,
  };
}

export async function updateFacilityAction(
  facilityId: string,
  formData: FormData,
): Promise<FacilityActionResult> {
  const { user } = await requireAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an admin.",
    };
  }

  const parsed = facilityFormSchema.safeParse(formDataToValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the facility details, then try again.",
    };
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("facilities")
    .select(
      "id,code,name,slug,level,type,capacity,description,status,requires_approval,display_order,is_archived",
    )
    .eq("id", facilityId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      status: "error",
      message: "Facility could not be found.",
    };
  }

  const facilityPayload = {
    code: parsed.data.code,
    name: parsed.data.name,
    slug: parsed.data.slug,
    level: parsed.data.level,
    type: parsed.data.type,
    capacity: parsed.data.capacity,
    description: parsed.data.description || null,
    status: parsed.data.status,
    requires_approval: parseRequiresApproval(parsed.data.requiresApproval),
    display_order: existing.display_order,
    is_archived: parsed.data.status === "archived",
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("facilities")
    .update(facilityPayload)
    .eq("id", facilityId);

  if (error) {
    console.error("Facility update failed", {
      facilityId,
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: getFriendlyFacilityError(),
    };
  }

  await insertAuditLog({
    action: "update",
    facilityId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary:
      existing.status === parsed.data.status
        ? `Updated facility ${parsed.data.code}.`
        : `Updated facility ${parsed.data.code} status from ${existing.status} to ${parsed.data.status}.`,
    oldValues: existing,
    newValues: facilityPayload,
  });

  revalidatePath("/facilities");
  revalidatePath(`/facilities/${parsed.data.slug}`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/admin/facilities/${facilityId}`);

  return {
    status: "success",
    message: "Facility updated. Employee-facing facility pages now use the saved details.",
    facilityId,
  };
}

export async function archiveFacilityAction(
  facilityId: string,
): Promise<FacilityActionResult> {
  try {
    const { user } = await requireAdmin();

    if (!user) {
      return {
        status: "error",
        message: "You must be signed in as an admin.",
      };
    }

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("facilities")
      .select(
        "id,code,name,slug,status,is_archived,requires_approval,display_order",
      )
      .eq("id", facilityId)
      .maybeSingle();

    if (existingError) {
      logFacilityArchiveError({
        stage: "lookup",
        facilityId,
        error: existingError,
      });

      return {
        status: "error",
        message: "Facility could not be found.",
      };
    }

    if (!existing) {
      return {
        status: "error",
        message: "Facility could not be found.",
      };
    }

    if (existing.status === "archived" || existing.is_archived) {
      return {
        status: "error",
        message: "This facility is already archived.",
      };
    }

    const facilityPayload = {
      status: "archived" as const,
      is_archived: true,
      updated_by: user.id,
    };

    const { error } = await supabase
      .from("facilities")
      .update(facilityPayload)
      .eq("id", facilityId);

    if (error) {
      logFacilityArchiveError({
        stage: "update",
        facilityId,
        error,
      });

      return {
        status: "error",
        message: getFriendlyFacilityArchiveError(),
      };
    }

    await insertAuditLog({
      action: "update",
      facilityId,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Facility archived: ${existing.code}.`,
      oldValues: existing,
      newValues: facilityPayload,
    });

    try {
      revalidatePath("/facilities");
      revalidatePath(`/facilities/${existing.slug}`);
      revalidatePath("/admin/facilities");
      revalidatePath(`/admin/facilities/${facilityId}`);
    } catch (error) {
      logFacilityArchiveError({
        stage: "revalidate",
        facilityId,
        error,
      });
    }

    return {
      status: "success",
      message:
        "Facility archived. It is hidden from employee booking pages while historical records are preserved.",
      facilityId,
    };
  } catch (error) {
    logFacilityArchiveError({
      stage: "unexpected",
      facilityId,
      error,
    });

    return {
      status: "error",
      message: getFriendlyFacilityArchiveError(),
    };
  }
}

export async function archiveFacilityFormAction(
  _previousState: FacilityActionResult,
  formData: FormData,
): Promise<FacilityActionResult> {
  try {
    const facilityId = getOptionalFormValue(formData, "facilityId");

    if (!facilityId) {
      return {
        status: "error",
        message: "Facility could not be found.",
      };
    }

    return archiveFacilityAction(facilityId);
  } catch (error) {
    logFacilityArchiveError({
      stage: "form",
      error,
    });

    return {
      status: "error",
      message: getFriendlyFacilityArchiveError(),
    };
  }
}
