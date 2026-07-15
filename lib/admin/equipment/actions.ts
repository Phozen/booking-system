"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import {
  equipmentFormSchema,
  equipmentIdSchema,
  formDataToEquipmentValues,
  type EquipmentFormValues,
} from "@/lib/admin/equipment/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export type EquipmentFieldErrors = Partial<
  Record<"name" | "description" | "iconName", string>
>;

export type EquipmentActionResult = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: EquipmentFieldErrors;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getEquipmentFieldErrors(errors: ZodError<EquipmentFormValues>) {
  const fieldErrors = errors.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    description: fieldErrors.description?.[0],
    iconName: fieldErrors.iconName?.[0],
  };
}

function revalidateEquipmentPaths() {
  revalidatePath("/admin/equipment");
  revalidatePath("/admin/facilities");
  revalidatePath("/admin/facilities/[id]", "page");
  revalidatePath("/facilities");
  revalidatePath("/(app)/facilities/[slug]", "page");
  revalidatePath("/bookings/new");
}

export async function createEquipmentAction(
  _previousState: EquipmentActionResult,
  formData: FormData,
): Promise<EquipmentActionResult> {
  void _previousState;
  const { user } = await requireAdmin();
  const parsed = equipmentFormSchema.safeParse(
    formDataToEquipmentValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the equipment details and try again.",
      fieldErrors: getEquipmentFieldErrors(parsed.error),
    };
  }

  const { name, description, iconName } = parsed.data;
  const payload = {
    name,
    description: description || null,
    icon_name: iconName || null,
    is_active: true,
  };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("equipment")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message:
        error?.code === "23505"
          ? "An equipment item with this name already exists."
          : "Equipment could not be created. Try again.",
    };
  }

  await createAuditLogSafely(supabase, {
    action: "create",
    entityType: "equipment",
    entityId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Created equipment ${name}.`,
    newValues: payload,
  });

  revalidateEquipmentPaths();

  return {
    status: "success",
    message: "Equipment created.",
  };
}

export async function updateEquipmentAction(
  equipmentId: string,
  _previousState: EquipmentActionResult,
  formData: FormData,
): Promise<EquipmentActionResult> {
  void _previousState;
  const { user } = await requireAdmin();

  if (!equipmentIdSchema.safeParse(equipmentId).success) {
    return { status: "error", message: "Equipment could not be found." };
  }

  const parsed = equipmentFormSchema.safeParse(
    formDataToEquipmentValues(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the equipment details and try again.",
      fieldErrors: getEquipmentFieldErrors(parsed.error),
    };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("equipment")
    .select("id,name,description,icon_name,is_active")
    .eq("id", equipmentId)
    .maybeSingle();

  if (!existing) {
    return { status: "error", message: "Equipment could not be found." };
  }

  const { name, description, iconName } = parsed.data;
  const payload = {
    name,
    description: description || null,
    icon_name: iconName || null,
  };

  if (
    existing.name === payload.name &&
    existing.description === payload.description &&
    existing.icon_name === payload.icon_name
  ) {
    return { status: "success", message: "Equipment details are already up to date." };
  }

  const { data: updated, error } = await supabase
    .from("equipment")
    .update(payload)
    .eq("id", equipmentId)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return {
      status: "error",
      message:
        error?.code === "23505"
          ? "An equipment item with this name already exists."
          : "Equipment details could not be updated. Try again.",
    };
  }

  await createAuditLogSafely(supabase, {
    action: "update",
    entityType: "equipment",
    entityId: equipmentId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Updated equipment ${existing.name}.`,
    oldValues: existing,
    newValues: payload,
  });

  revalidateEquipmentPaths();

  return { status: "success", message: "Equipment details updated." };
}

export async function toggleEquipmentActiveAction(
  equipmentId: string,
  active: boolean,
  _previousState: EquipmentActionResult,
  _formData: FormData,
): Promise<EquipmentActionResult> {
  void _previousState;
  void _formData;
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("equipment")
    .select("id,name,is_active")
    .eq("id", equipmentId)
    .maybeSingle();

  if (!existing) {
    return {
      status: "error",
      message: "Equipment could not be found.",
    };
  }

  const { error } = await supabase
    .from("equipment")
    .update({ is_active: active })
    .eq("id", equipmentId);

  if (error) {
    return {
      status: "error",
      message: "Equipment status could not be updated.",
    };
  }

  await createAuditLogSafely(supabase, {
    action: "update",
    entityType: "equipment",
    entityId: equipmentId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `${active ? "Reactivated" : "Archived"} equipment ${existing.name}.`,
    oldValues: existing,
    newValues: { is_active: active },
  });

  revalidateEquipmentPaths();

  return {
    status: "success",
    message: active ? "Equipment reactivated." : "Equipment archived.",
  };
}

export async function updateFacilityEquipmentAction(
  facilityId: string,
  _previousState: EquipmentActionResult,
  formData: FormData,
): Promise<EquipmentActionResult> {
  void _previousState;
  const { user } = await requireAdmin();
  const equipmentIds = formData.getAll("equipmentId").filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  const supabase = createAdminClient();

  const rows = equipmentIds.map((equipmentId) => {
    const quantity = Number(getText(formData, `quantity-${equipmentId}`) || "1");

    return {
      facility_id: facilityId,
      equipment_id: equipmentId,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
      notes: getText(formData, `notes-${equipmentId}`) || null,
    };
  });

  const { error: deleteError } = await supabase
    .from("facility_equipment")
    .delete()
    .eq("facility_id", facilityId);

  if (deleteError) {
    return {
      status: "error",
      message: "Facility equipment could not be updated.",
    };
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("facility_equipment")
      .insert(rows);

    if (insertError) {
      return {
        status: "error",
        message: "Facility equipment could not be updated.",
      };
    }
  }

  await createAuditLogSafely(supabase, {
    action: "update",
    entityType: "facility",
    entityId: facilityId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: "Updated facility equipment.",
    newValues: { equipmentIds },
  });

  revalidatePath(`/admin/facilities/${facilityId}`);
  revalidatePath("/admin/facilities");
  revalidatePath("/facilities");

  return {
    status: "success",
    message: "Facility equipment updated.",
  };
}
