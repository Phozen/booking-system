"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";

export type EquipmentActionResult = {
  status: "idle" | "success" | "error";
  message: string;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createEquipmentAction(
  _previousState: EquipmentActionResult,
  formData: FormData,
): Promise<EquipmentActionResult> {
  void _previousState;
  const { user } = await requireAdmin();
  const name = getText(formData, "name");

  if (!name) {
    return {
      status: "error",
      message: "Enter an equipment name.",
    };
  }

  const payload = {
    name,
    description: getText(formData, "description") || null,
    icon_name: getText(formData, "iconName") || null,
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
      message: "Equipment could not be created. Check for duplicate names.",
    };
  }

  await createAuditLogSafely(supabase, {
    action: "create",
    entityType: "facility",
    entityId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `Created equipment ${name}.`,
    newValues: payload,
  });

  revalidatePath("/admin/equipment");
  revalidatePath("/admin/facilities");
  revalidatePath("/facilities");

  return {
    status: "success",
    message: "Equipment created.",
  };
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
    entityType: "facility",
    entityId: equipmentId,
    actorUserId: user.id,
    actorEmail: user.email,
    summary: `${active ? "Reactivated" : "Archived"} equipment ${existing.name}.`,
    oldValues: existing,
    newValues: { is_active: active },
  });

  revalidatePath("/admin/equipment");
  revalidatePath("/admin/facilities");
  revalidatePath("/facilities");

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
