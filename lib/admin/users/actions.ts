"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import {
  countOtherActiveSuperAdmins,
  getAdminUserById,
} from "@/lib/admin/users/queries";
import {
  formDataToUserEditInput,
  isSelfRoleOrStatusChange,
  removesActiveAdminAccess,
  userEditSchema,
} from "@/lib/admin/users/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateUserProfileAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const { user } = await requireSuperAdmin();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in as an active super admin.",
    };
  }

  const parsed = userEditSchema.safeParse(formDataToUserEditInput(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the user details, then try again.",
    };
  }

  const supabase = createAdminClient();
  const existing = await getAdminUserById(supabase, parsed.data.userId);

  if (!existing) {
    return {
      status: "error",
      message: "User profile could not be found.",
    };
  }

  if (
    isSelfRoleOrStatusChange({
      actorUserId: user.id,
      targetUserId: existing.id,
      existingRole: existing.role,
      existingStatus: existing.status,
      nextRole: parsed.data.role,
      nextStatus: parsed.data.status,
    })
  ) {
    return {
      status: "error",
      message: "For safety, you cannot change your own role or status.",
    };
  }

  if (
    removesActiveAdminAccess({
      existingRole: existing.role,
      existingStatus: existing.status,
      nextRole: parsed.data.role,
      nextStatus: parsed.data.status,
    })
  ) {
    const otherActiveSuperAdmins = await countOtherActiveSuperAdmins(supabase, existing.id);

    if (otherActiveSuperAdmins < 1) {
      return {
        status: "error",
        message: "This change would remove the final active super admin. Add or activate another super admin first.",
      };
    }
  }

  const payload = {
    full_name: normalizeOptionalText(parsed.data.fullName),
    department: normalizeOptionalText(parsed.data.department),
    phone: normalizeOptionalText(parsed.data.phone),
    role: parsed.data.role,
    status: parsed.data.status,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", existing.id);

  if (error) {
    console.error("Admin user update failed", {
      userId: existing.id,
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: "User profile could not be saved. Please try again.",
    };
  }

  const oldValues = {
    fullName: existing.fullName,
    department: existing.department,
    phone: existing.phone,
    role: existing.role,
    status: existing.status,
  };
  const newValues = {
    fullName: payload.full_name,
    department: payload.department,
    phone: payload.phone,
    role: payload.role,
    status: payload.status,
  };

  if (existing.role !== parsed.data.role) {
    await createAuditLogSafely(
      supabase,
      {
        action: "role_change",
        entityType: "user",
        entityId: existing.id,
        actorUserId: user.id,
        actorEmail: user.email,
        summary: `Changed ${existing.email} role from ${existing.role} to ${parsed.data.role}.`,
        oldValues: { role: existing.role },
        newValues: { role: parsed.data.role },
        metadata: { targetEmail: existing.email },
      },
      { userId: existing.id },
    );
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "update",
      entityType: "user",
      entityId: existing.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Updated user profile for ${existing.email}.`,
      oldValues,
      newValues,
      metadata: { targetEmail: existing.email },
    },
    { userId: existing.id },
  );

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${existing.id}`);

  return {
    status: "success",
    message:
      "User profile saved. Role and access changes take effect the next time protected pages are checked.",
  };
}
