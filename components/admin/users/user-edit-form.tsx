"use client";

import type { FormEvent } from "react";
import { useActionState, useRef, useState } from "react";

import {
  updateUserProfileAction,
  type UserActionResult,
} from "@/lib/admin/users/actions";
import type { AdminUserProfile } from "@/lib/admin/users/queries";
import {
  editableUserRoleOptions,
  editableUserStatusOptions,
  formDataToUserEditInput,
  formatUserRole,
  formatUserStatus,
  userEditSchema,
  type UserRole,
  type UserStatus,
} from "@/lib/admin/users/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UserActionResult = {
  status: "idle",
  message: "",
};

type FieldId = "fullName" | "department" | "phone" | "role" | "status";
type FieldErrors = Partial<Record<FieldId, string>>;

function getFirstError(error?: string[]) {
  return error?.[0];
}

function getConfirmCopy({
  initialStatus,
  selectedStatus,
  initialRole,
  selectedRole,
  isSelf,
}: {
  initialStatus: UserStatus;
  selectedStatus: UserStatus;
  initialRole: UserRole;
  selectedRole: UserRole;
  isSelf: boolean;
}) {
  if (isSelf && (initialRole !== selectedRole || initialStatus !== selectedStatus)) {
    return {
      triggerLabel: "Save user changes",
      confirmLabel: "Save changes",
      cancelLabel: "Go back",
      destructive: false,
      description:
        "Profile field changes can be saved, but your own role or status changes will be blocked for safety.",
    };
  }

  if (selectedStatus === "disabled" && initialStatus !== "disabled") {
    return {
      triggerLabel: "Disable user",
      confirmLabel: "Disable user",
      cancelLabel: "Keep active",
      destructive: true,
      description:
        "This will disable the user profile. Disabled users cannot access protected employee or admin pages.",
    };
  }

  if (selectedStatus === "active" && initialStatus !== "active") {
    return {
      triggerLabel: "Reactivate user",
      confirmLabel: "Reactivate user",
      cancelLabel: "Go back",
      destructive: false,
      description:
        "This will set the user status to active so the account can access protected pages according to its role.",
    };
  }

  if (selectedStatus === "pending" && initialStatus !== "pending") {
    return {
      triggerLabel: "Set user pending",
      confirmLabel: "Set pending",
      cancelLabel: "Go back",
      destructive: true,
      description:
        "This will set the user status to pending. Pending users cannot access protected employee or admin pages.",
    };
  }

  if (selectedRole !== initialRole) {
    return {
      triggerLabel: "Save role change",
      confirmLabel: "Save role change",
      cancelLabel: "Go back",
      destructive: selectedRole !== "admin",
      description:
        selectedRole === "admin"
          ? "This will grant administrator access to this user."
          : "This will remove administrator access from this user.",
    };
  }

  return {
    triggerLabel: "Save user changes",
    confirmLabel: "Save changes",
    cancelLabel: "Go back",
    destructive: false,
    description: "This will update the user's editable profile fields.",
  };
}

export function UserEditForm({
  user,
  currentUserId,
}: {
  user: AdminUserProfile;
  currentUserId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateUserProfileAction,
    initialState,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(user.status);
  const formRef = useRef<HTMLFormElement>(null);
  const isSelf = currentUserId === user.id;
  const confirmCopy = getConfirmCopy({
    initialStatus: user.status,
    selectedStatus,
    initialRole: user.role,
    selectedRole,
    isSelf,
  });

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = userEditSchema.safeParse(formDataToUserEditInput(formData));

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: getFirstError(errors.fullName),
        department: getFirstError(errors.department),
        phone: getFirstError(errors.phone),
        role: getFirstError(errors.role),
        status: getFirstError(errors.status),
      });
      event.preventDefault();
      return;
    }

    setFieldErrors({});
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 rounded-lg border border-border/70 bg-card p-5 shadow-sm"
      noValidate
      onSubmit={validateBeforeSubmit}
    >
      <input type="hidden" name="userId" value={user.id} />
      {isSelf ? (
        <>
          <input type="hidden" name="role" value={user.role} />
          <input type="hidden" name="status" value={user.status} />
        </>
      ) : null}

      <div>
        <h2 className="font-semibold tracking-normal">Edit user</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update application profile fields, role, and access status. Supabase
          Auth email and password changes are intentionally outside this page.
        </p>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {isSelf ? (
        <Alert>
          <AlertDescription>
            You are editing your own profile. Role and status controls are locked
            to prevent accidental loss of admin access.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-normal">Profile fields</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These optional fields help admins identify employees in booking and
            report views.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={user.fullName ?? ""}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.fullName && "fullName-error",
              )}
              aria-invalid={Boolean(fieldErrors.fullName)}
            />
            <FormFieldError id="fullName-error">
              {fieldErrors.fullName}
            </FormFieldError>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              defaultValue={user.department ?? ""}
              aria-describedby={getFieldDescribedBy(
                fieldErrors.department && "department-error",
              )}
              aria-invalid={Boolean(fieldErrors.department)}
            />
            <FormFieldError id="department-error">
              {fieldErrors.department}
            </FormFieldError>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={user.phone ?? ""}
              aria-describedby={getFieldDescribedBy(
                "phone-helper",
                fieldErrors.phone && "phone-error",
              )}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            <FormFieldHelper id="phone-helper">
              Optional internal contact number.
            </FormFieldHelper>
            <FormFieldError id="phone-error">{fieldErrors.phone}</FormFieldError>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t pt-5">
        <div>
          <h3 className="text-sm font-semibold tracking-normal">Access controls</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Role controls admin access. Status controls whether the user can
            access protected pages.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={selectedRole}
              disabled={isSelf}
              onChange={(event) => setSelectedRole(event.target.value as UserRole)}
              aria-describedby={getFieldDescribedBy(
                "role-helper",
                fieldErrors.role && "role-error",
              )}
              aria-invalid={Boolean(fieldErrors.role)}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editableUserRoleOptions.map((role) => (
                <option key={role} value={role}>
                  {formatUserRole(role)}
                </option>
              ))}
            </select>
            <FormFieldHelper id="role-helper">
              Admin users can manage bookings, facilities, reports, settings,
              audit logs, and users.
            </FormFieldHelper>
            <FormFieldError id="role-error">{fieldErrors.role}</FormFieldError>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={selectedStatus}
              disabled={isSelf}
              onChange={(event) =>
                setSelectedStatus(event.target.value as UserStatus)
              }
              aria-describedby={getFieldDescribedBy(
                "status-helper",
                fieldErrors.status && "status-error",
              )}
              aria-invalid={Boolean(fieldErrors.status)}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editableUserStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatUserStatus(status)}
                </option>
              ))}
            </select>
            <FormFieldHelper id="status-helper">
              Disabled and pending users are blocked from protected app pages.
            </FormFieldHelper>
            <FormFieldError id="status-error">{fieldErrors.status}</FormFieldError>
          </div>
        </div>
      </section>

      <div className="grid border-t pt-5 sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <ConfirmDialog
          triggerLabel={isPending ? "Saving..." : confirmCopy.triggerLabel}
          title="Confirm user update"
          description={
            <span>
              {confirmCopy.description} The change will be audit logged.
            </span>
          }
          confirmLabel={confirmCopy.confirmLabel}
          cancelLabel={confirmCopy.cancelLabel}
          pendingLabel="Saving..."
          destructive={confirmCopy.destructive}
          disabled={isPending}
          pending={isPending}
          triggerClassName="w-full sm:w-auto"
          onConfirm={() => formRef.current?.requestSubmit()}
        />
      </div>
    </form>
  );
}
