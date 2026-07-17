"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";

function readDepartment(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  return { name, email, isActive: formData.get("isActive") === "on" };
}

export async function saveDepartmentAction(formData: FormData) {
  const { user, profile } = await requireSuperAdmin();
  if (!user || profile?.status !== "active") throw new Error("Super Admin access required.");
  const values = readDepartment(formData);
  if (!values.name || !/^\S+@\S+\.\S+$/.test(values.email)) throw new Error("Enter a department name and valid email.");
  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();
  const result = id
    ? await supabase.from("departments").update({ name: values.name, email: values.email, is_active: values.isActive }).eq("id", id)
    : await supabase.from("departments").insert({ name: values.name, email: values.email, is_active: values.isActive });
  if (result.error) throw new Error("Department could not be saved.");
  await createAuditLogSafely(supabase, {
    action: id ? "update" : "create", entityType: "system_setting", actorUserId: user.id, actorEmail: user.email,
    summary: `${id ? "Updated" : "Created"} department ${values.name}.`, newValues: values,
  });
  revalidatePath("/admin/departments");
  revalidatePath("/bookings/new");
}
