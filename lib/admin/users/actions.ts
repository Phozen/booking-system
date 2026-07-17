"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAuditLogSafely } from "@/lib/audit/log";
import {
  getAdminUserById,
} from "@/lib/admin/users/queries";
import {
  approvedUserCreateSchema,
  formDataToApprovedUserCreateInput,
  formDataToUserEditInput,
  isSelfRoleOrStatusChange,
  userEditSchema,
} from "@/lib/admin/users/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeAccessEmail } from "@/lib/auth/access";

export type UserActionResult = {
  status: "idle" | "error" | "success";
  message: string;
};

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function provisionApprovedUserAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const { user } = await requireSuperAdmin();
  const parsed = approvedUserCreateSchema.safeParse(
    formDataToApprovedUserCreateInput(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the provisioning details.",
    };
  }

  const supabase = createAdminClient();
  const email = normalizeAccessEmail(parsed.data.email);
  const { data, error } = await supabase
    .from("approved_users")
    .insert({
      email,
      role: parsed.data.role,
      status: parsed.data.status,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message:
        error?.code === "23505"
          ? "That exact email already has an access record."
          : "The individual access record could not be created.",
    };
  }

  await createAuditLogSafely(
    supabase,
    {
      action: "create",
      entityType: "user",
      entityId: data.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: `Created an individual Qbook access record for ${email}.`,
      newValues: { email, role: parsed.data.role, status: parsed.data.status },
    },
    { userId: user.id },
  );

  revalidatePath("/admin/users");
  return {
    status: "success",
    message: "Individual access record created. The employee can sign in with Microsoft.",
  };
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
      targetUserId: existing.authUserId ?? "",
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

  const profilePayload = {
    full_name: normalizeOptionalText(parsed.data.fullName),
    department: normalizeOptionalText(parsed.data.department),
    phone: normalizeOptionalText(parsed.data.phone),
  };
  const accessPayload = {
    role: parsed.data.role,
    status: parsed.data.status,
    updated_by: user.id,
  };

  const sessionClient = await createClient();
  const { error } = await sessionClient.rpc("update_approved_user_access", {
    p_approved_user_id: existing.id,
    p_role: accessPayload.role,
    p_status: accessPayload.status,
  });

  if (error) {
    console.error("Admin user update failed", {
      userId: existing.id,
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: error.message.includes("final active Super Admin")
        ? "This change would remove the final active Super Admin. Add or activate another Super Admin first."
        : "Approved access could not be saved. Please refresh and try again.",
    };
  }

  if (existing.authUserId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        ...profilePayload,
        role: parsed.data.role,
        status: parsed.data.status,
      })
      .eq("id", existing.authUserId);

    if (profileError) {
      console.error("Linked profile sync failed", {
        approvedUserId: existing.id,
        authUserId: existing.authUserId,
        code: profileError.code,
      });
    }
  }

  const oldValues = {
    fullName: existing.fullName,
    department: existing.department,
    phone: existing.phone,
    role: existing.role,
    status: existing.status,
  };
  const newValues = {
    fullName: profilePayload.full_name,
    department: profilePayload.department,
    phone: profilePayload.phone,
    role: accessPayload.role,
    status: accessPayload.status,
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
      { userId: existing.authUserId ?? undefined },
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
    { userId: existing.authUserId ?? undefined },
  );

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${existing.id}`);

  return {
    status: "success",
    message:
      "User profile saved. Role and access changes take effect the next time protected pages are checked.",
  };
}
