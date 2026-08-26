"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLogSafely } from "@/lib/audit/log";
import { requireUser } from "@/lib/auth/guards";
import { getOwnProfile } from "@/lib/profile/queries";
import {
  buildProfileUpdatePayload,
  formDataToProfileUpdateInput,
  profileUpdateSchema,
} from "@/lib/profile/validation";
import type { ProfileActionResult } from "@/lib/profile/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { withFlashToast } from "@/lib/ui/flash-toasts";

export async function updateOwnProfileAction(
  _previousState: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const { user } = await requireUser();
  const parsed = profileUpdateSchema.safeParse(
    formDataToProfileUpdateInput(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check your profile details, then try again.",
    };
  }

  const supabase = await createClient();
  const existingProfile = await getOwnProfile(supabase, user.id);

  if (!existingProfile) {
    return {
      status: "error",
      message: "Your profile could not be found.",
    };
  }

  const updatePayload = buildProfileUpdatePayload(parsed.data);
  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed", {
      userId: user.id,
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: "Your profile could not be updated. Please try again.",
    };
  }

  const auditClient = createAdminClient();
  await createAuditLogSafely(
    auditClient,
    {
      action: "update",
      entityType: "user",
      entityId: user.id,
      actorUserId: user.id,
      actorEmail: user.email,
      summary: "Updated own profile.",
      oldValues: {
        fullName: existingProfile.fullName,
        department: existingProfile.department,
        phone: existingProfile.phone,
      },
      newValues: {
        fullName: parsed.data.fullName,
        department: parsed.data.department || null,
        phone: parsed.data.phone || null,
      },
      metadata: {
        selfService: true,
      },
    },
    { userId: user.id },
  );

  revalidatePath("/profile");
  revalidatePath("/admin/profile");
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");

  const homePath =
    String(formData.get("profileArea") ?? "").trim() === "admin"
      ? "/admin/dashboard"
      : "/dashboard";

  redirect(withFlashToast(homePath, "profile-saved"));
}
