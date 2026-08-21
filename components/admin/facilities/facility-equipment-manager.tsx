"use client";

import { useActionState } from "react";

import {
  updateFacilityEquipmentAction,
  type EquipmentActionResult,
} from "@/lib/admin/equipment/actions";
import type { EquipmentItem } from "@/lib/admin/equipment/queries";
import type { Facility } from "@/lib/facilities/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: EquipmentActionResult = {
  status: "idle",
  message: "",
};

export function FacilityEquipmentManager({
  facility,
  equipment,
}: {
  facility: Facility;
  equipment: EquipmentItem[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateFacilityEquipmentAction.bind(null, facility.id),
    initialState,
  );
  const assigned = new Map(facility.equipment.map((item) => [item.id, item]));
  const activeEquipment = equipment.filter((item) => item.isActive);

  return (
    <section className="rounded-lg border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          Facility equipment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tick what this room has, then set the quantity.
        </p>
      </div>

      <form action={formAction} className="mt-4 grid gap-4">
        {state.status !== "idle" ? (
          <Alert variant={state.status === "error" ? "destructive" : "success"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {activeEquipment.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {activeEquipment.map((item) => {
              const current = assigned.get(item.id);

              return (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-border/80 bg-background p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-accent/40"
                >
                  <label className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      name="equipmentId"
                      value={item.id}
                      defaultChecked={Boolean(current)}
                      disabled={isPending}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    <span className="min-w-0 text-sm font-medium leading-5">
                      {item.name}
                    </span>
                  </label>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                    <Label
                      htmlFor={`quantity-${item.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Qty
                    </Label>
                    <Input
                      id={`quantity-${item.id}`}
                      name={`quantity-${item.id}`}
                      type="number"
                      min={1}
                      defaultValue={current?.quantity ?? 1}
                      disabled={isPending}
                      className="h-9"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            No active equipment in the catalog yet. Add items in the equipment
            catalog on the Facilities page.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <PendingButtonContent pending={isPending} pendingLabel="Saving...">
              Save equipment
            </PendingButtonContent>
          </Button>
        </div>
      </form>
    </section>
  );
}
