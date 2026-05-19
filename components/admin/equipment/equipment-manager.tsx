"use client";

import { useActionState } from "react";

import {
  createEquipmentAction,
  toggleEquipmentActiveAction,
  type EquipmentActionResult,
} from "@/lib/admin/equipment/actions";
import type { EquipmentItem } from "@/lib/admin/equipment/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { StatusBadge } from "@/components/shared/status-badge";

const initialState: EquipmentActionResult = {
  status: "idle",
  message: "",
};

function EquipmentStatusForm({ item }: { item: EquipmentItem }) {
  const [state, formAction, isPending] = useActionState(
    toggleEquipmentActiveAction.bind(null, item.id, !item.isActive),
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        variant={item.isActive ? "outline" : "secondary"}
        size="sm"
        disabled={isPending}
      >
        <PendingButtonContent
          pending={isPending}
          pendingLabel={item.isActive ? "Archiving..." : "Restoring..."}
        >
          {item.isActive ? "Archive" : "Reactivate"}
        </PendingButtonContent>
      </Button>
    </form>
  );
}

export function EquipmentManager({ equipment }: { equipment: EquipmentItem[] }) {
  const [state, formAction, isPending] = useActionState(
    createEquipmentAction,
    initialState,
  );

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="font-semibold tracking-normal">Add equipment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Equipment can be assigned to facilities after it is created.
          </p>
        </div>
        {state.status !== "idle" ? (
          <Alert variant={state.status === "error" ? "destructive" : "success"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" disabled={isPending} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="iconName">Icon name</Label>
            <Input id="iconName" name="iconName" disabled={isPending} />
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" disabled={isPending} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <PendingButtonContent pending={isPending} pendingLabel="Creating...">
              Create equipment
            </PendingButtonContent>
          </Button>
        </div>
      </form>

      <section className="rounded-lg border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold tracking-normal">Equipment library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Archived equipment remains in historical facility records but is not
            offered for new assignment.
          </p>
        </div>
        <div className="divide-y">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <StatusBadge
                    kind="user"
                    status={item.isActive ? "active" : "disabled"}
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description || "No description."}
                </p>
              </div>
              <EquipmentStatusForm item={item} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
