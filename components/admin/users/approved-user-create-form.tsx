"use client";

import { useActionState } from "react";

import {
  provisionApprovedUserAction,
  type UserActionResult,
} from "@/lib/admin/users/actions";
import {
  editableUserRoleOptions,
  editableUserStatusOptions,
  formatUserRole,
  formatUserStatus,
} from "@/lib/admin/users/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: UserActionResult = { status: "idle", message: "" };

export function ApprovedUserCreateForm() {
  const [state, action, pending] = useActionState(
    provisionApprovedUserAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm"
    >
      <div>
        <h2 className="font-semibold tracking-normal">Pre-provision employee</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the exact Microsoft email before first sign-in. A company domain by
          itself never grants access.
        </p>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="approved-email">Exact employee email</Label>
          <Input
            id="approved-email"
            name="email"
            type="email"
            autoComplete="off"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="approved-role">Role</Label>
          <Select id="approved-role" name="role" defaultValue="employee">
            {editableUserRoleOptions.map((role) => (
              <option key={role} value={role}>
                {formatUserRole(role)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="approved-status">Status</Label>
          <Select id="approved-status" name="status" defaultValue="active">
            {editableUserStatusOptions.map((status) => (
              <option key={status} value={status}>
                {formatUserStatus(status)}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          <PendingButtonContent pending={pending} pendingLabel="Adding...">
            Add employee
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
