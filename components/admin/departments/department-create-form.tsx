"use client";

import { useActionState } from "react";

import { saveDepartmentAction, type DepartmentActionState } from "@/lib/departments/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: DepartmentActionState = { status: "idle", message: "" };

export function DepartmentCreateForm() {
  const [state, action, pending] = useActionState(saveDepartmentAction, initialState);

  return (
    <form action={action} className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
      <div>
        <h2 className="font-semibold tracking-normal">Add department</h2>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto] md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="department-name">Department</Label>
          <Input id="department-name" name="name" required disabled={pending} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="department-email">Mailbox</Label>
          <Input id="department-email" name="email" type="email" required disabled={pending} />
        </div>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked disabled={pending} />
          Active
        </label>
        <Button type="submit" disabled={pending}>
          <PendingButtonContent pending={pending} pendingLabel="Adding...">
            Add department
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
