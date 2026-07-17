"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";

export type DepartmentActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

function readDepartment(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  return { name, email, isActive: formData.get("isActive") === "on" };
}

export async function saveDepartmentAction(
  _previousState: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  const { user, profile } = await requireSuperAdmin();
  if (!user || profile?.status !== "active") {
    return { status: "error", message: "Super Admin access is required." };
  }
  const values = readDepartment(formData);
  if (!values.name || !/^\S+@\S+\.\S+$/.test(values.email)) {
    return { status: "error", message: "Enter a department name and valid email." };
  }
  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();
  const result = id
    ? await supabase.from("departments").update({ name: values.name, email: values.email, is_active: values.isActive }).eq("id", id).select("id").maybeSingle()
    : await supabase.from("departments").insert({ name: values.name, email: values.email, is_active: values.isActive }).select("id").maybeSingle();
  if (result.error || !result.data) {
    console.error("Department save failed", { id, code: result.error?.code, message: result.error?.message });
    return {
      status: "error",
      message: result.error?.code === "23505"
        ? "Department name and mailbox must each be unique."
        : "Department could not be saved. Please try again.",
    };
  }
  await createAuditLogSafely(supabase, {
    action: id ? "update" : "create", entityType: "system_setting", actorUserId: user.id, actorEmail: user.email,
    summary: `${id ? "Updated" : "Created"} department ${values.name}.`, newValues: values,
  });
  revalidatePath("/admin/departments");
  revalidatePath("/bookings/new");
  return { status: "success", message: id ? "Department updated." : "Department added." };
}
