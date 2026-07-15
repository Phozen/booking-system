"use client";

import { useActionState } from "react";

import {
  createEquipmentAction,
  type EquipmentActionResult,
} from "@/lib/admin/equipment/actions";
import type { EquipmentItem } from "@/lib/admin/equipment/queries";
import { EquipmentItemManager } from "@/components/admin/equipment/equipment-item-manager";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { EmptyState } from "@/components/shared/empty-state";
import { FormFieldError, getFieldDescribedBy } from "@/components/shared/form-field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Textarea } from "@/components/ui/textarea";

const initialState: EquipmentActionResult = {
  status: "idle",
  message: "",
};

export function EquipmentManager({ equipment }: { equipment: EquipmentItem[] }) {
  const [state, formAction, isPending] = useActionState(
    createEquipmentAction,
    initialState,
  );

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-4 rounded-lg border bg-card p-5">
        <ActionToastEffect
          state={state}
          successTitle="Equipment created"
          errorTitle="Equipment could not be created"
        />
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
            <Input
              id="name"
              name="name"
              disabled={isPending}
              maxLength={120}
              aria-describedby={getFieldDescribedBy(
                state.fieldErrors?.name && "name-error",
              )}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              required
            />
            <FormFieldError id="name-error">
              {state.fieldErrors?.name}
            </FormFieldError>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="iconName">Icon name (optional)</Label>
            <Input
              id="iconName"
              name="iconName"
              disabled={isPending}
              maxLength={80}
              aria-describedby={getFieldDescribedBy(
                state.fieldErrors?.iconName && "icon-name-error",
              )}
              aria-invalid={Boolean(state.fieldErrors?.iconName)}
            />
            <FormFieldError id="icon-name-error">
              {state.fieldErrors?.iconName}
            </FormFieldError>
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              disabled={isPending}
              maxLength={1000}
              rows={3}
              aria-describedby={getFieldDescribedBy(
                state.fieldErrors?.description && "description-error",
              )}
              aria-invalid={Boolean(state.fieldErrors?.description)}
            />
            <FormFieldError id="description-error">
              {state.fieldErrors?.description}
            </FormFieldError>
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

      <section className="grid gap-4" aria-labelledby="equipment-library-heading">
        <div>
          <h2 id="equipment-library-heading" className="font-semibold tracking-normal">
            Equipment library
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open an item to edit its details or availability. Archived equipment
            remains in historical facility records but is not offered for new assignment.
          </p>
        </div>
        {equipment.length > 0 ? (
          <div className="grid gap-3">
            {equipment.map((item) => (
              <EquipmentItemManager key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No equipment yet"
            description="Create the first equipment item to make it available for facility assignment."
          />
        )}
      </section>
    </div>
  );
}
