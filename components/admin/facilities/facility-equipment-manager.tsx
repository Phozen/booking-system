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
      </div>

      <form action={formAction} className="mt-5 grid gap-4">
        {state.status !== "idle" ? (
          <Alert variant={state.status === "error" ? "destructive" : "success"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {activeEquipment.length > 0 ? (
          activeEquipment.map((item) => {
            const current = assigned.get(item.id);

            return (
              <div key={item.id} className="grid gap-3 rounded-lg border p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="equipmentId"
                    value={item.id}
                    defaultChecked={Boolean(current)}
                    disabled={isPending}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    <span className="block font-medium">{item.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {item.description || "No description."}
                    </span>
                  </span>
                </label>
                <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <div className="grid gap-2">
                    <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      name={`quantity-${item.id}`}
                      type="number"
                      min={1}
                      defaultValue={current?.quantity ?? 1}
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                    <Input
                      id={`notes-${item.id}`}
                      name={`notes-${item.id}`}
                      defaultValue={current?.notes ?? ""}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            No active equipment exists yet. Add equipment from Admin Equipment.
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
