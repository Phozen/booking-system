import { z } from "zod";

export const userRoleOptions = ["all", "employee", "admin", "super_admin"] as const;
export const editableUserRoleOptions = ["employee", "admin", "super_admin"] as const;

export const userStatusOptions = ["all", "active", "disabled", "pending"] as const;
export const editableUserStatusOptions = ["active", "disabled", "pending"] as const;

export type UserRole = (typeof editableUserRoleOptions)[number];
export type UserStatus = (typeof editableUserStatusOptions)[number];

export type UserFilters = {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
};

export type UserFilterInput = {
  search?: string | string[];
  role?: string | string[];
  status?: string | string[];
};

const userFilterSchema = z.object({
  search: z.string().trim().max(160).optional(),
  role: z.enum(userRoleOptions).optional(),
  status: z.enum(userStatusOptions).optional(),
});

export const userEditSchema = z.object({
  userId: z.uuid(),
  fullName: z.string().trim().max(160, "Full name must be 160 characters or fewer.").optional(),
  department: z.string().trim().max(120, "Department must be 120 characters or fewer.").optional(),
  phone: z.string().trim().max(60, "Phone must be 60 characters or fewer.").optional(),
  role: z.enum(editableUserRoleOptions),
  status: z.enum(editableUserStatusOptions),
});

export type UserEditInput = z.infer<typeof userEditSchema>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseUserFilters(input: UserFilterInput): UserFilters {
  const parsed = userFilterSchema.safeParse({
    search: firstValue(input.search),
    role: firstValue(input.role),
    status: firstValue(input.status),
  });

  if (!parsed.success) {
    return {};
  }

  return {
    search: parsed.data.search || undefined,
    role:
      parsed.data.role && parsed.data.role !== "all"
        ? parsed.data.role
        : undefined,
    status:
      parsed.data.status && parsed.data.status !== "all"
        ? parsed.data.status
        : undefined,
  };
}

export function userFiltersToSearchParams(filters: UserFilters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.role) {
    params.set("role", filters.role);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return params;
}

export function formDataToUserEditInput(formData: FormData) {
  return {
    userId: String(formData.get("userId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    department: String(formData.get("department") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
}

export function isSelfRoleOrStatusChange({
  actorUserId,
  targetUserId,
  existingRole,
  existingStatus,
  nextRole,
  nextStatus,
}: {
  actorUserId: string;
  targetUserId: string;
  existingRole: UserRole;
  existingStatus: UserStatus;
  nextRole: UserRole;
  nextStatus: UserStatus;
}) {
  return (
    actorUserId === targetUserId &&
    (existingRole !== nextRole || existingStatus !== nextStatus)
  );
}

export function removesActiveAdminAccess({
  existingRole,
  existingStatus,
  nextRole,
  nextStatus,
}: {
  existingRole: UserRole;
  existingStatus: UserStatus;
  nextRole: UserRole;
  nextStatus: UserStatus;
}) {
  return (
    existingRole === "super_admin" &&
    existingStatus === "active" &&
    (nextRole !== "super_admin" || nextStatus !== "active")
  );
}

export function formatUserRole(role: UserRole) {
  const labels: Record<UserRole, string> = {
    employee: "Employee",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return labels[role];
}

export function formatUserStatus(status: UserStatus) {
  const labels: Record<UserStatus, string> = {
    active: "Active",
    disabled: "Disabled",
    pending: "Pending",
  };

  return labels[status];
}
