"use client";

import { ChevronDown } from "lucide-react";
import { useActionState } from "react";

import {
  toggleEquipmentActiveAction,
  updateEquipmentAction,
  type EquipmentActionResult,
} from "@/lib/admin/equipment/actions";
import type { EquipmentItem } from "@/lib/admin/equipment/queries";
import { cn } from "@/lib/utils";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: EquipmentActionResult = {
  status: "idle",
  message: "",
};

function EquipmentEditForm({ item }: { item: EquipmentItem }) {
  const [state, formAction, isPending] = useActionState(
    updateEquipmentAction.bind(null, item.id),
    initialState,
  );
  const idPrefix = `equipment-${item.id}`;

  return (
    <form action={formAction} className="grid gap-4">
      <ActionToastEffect
        state={state}
        successTitle="Equipment updated"
        errorTitle="Equipment could not be updated"
      />
      <div>
        <h4 className="font-medium">Edit details</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes appear anywhere this equipment is assigned to a facility.
        </p>
      </div>
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            name="name"
            defaultValue={item.name}
            disabled={isPending}
            maxLength={120}
            aria-describedby={getFieldDescribedBy(
              state.fieldErrors?.name && `${idPrefix}-name-error`,
            )}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            required
          />
          <FormFieldError id={`${idPrefix}-name-error`}>
            {state.fieldErrors?.name}
          </FormFieldError>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-icon-name`}>Icon name (optional)</Label>
          <Input
            id={`${idPrefix}-icon-name`}
            name="iconName"
            defaultValue={item.iconName ?? ""}
            disabled={isPending}
            maxLength={80}
            aria-describedby={getFieldDescribedBy(
              state.fieldErrors?.iconName && `${idPrefix}-icon-name-error`,
            )}
            aria-invalid={Boolean(state.fieldErrors?.iconName)}
          />
          <FormFieldError id={`${idPrefix}-icon-name-error`}>
            {state.fieldErrors?.iconName}
          </FormFieldError>
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
          <Textarea
            id={`${idPrefix}-description`}
            name="description"
            defaultValue={item.description ?? ""}
            disabled={isPending}
            maxLength={1000}
            rows={3}
            aria-describedby={getFieldDescribedBy(
              state.fieldErrors?.description && `${idPrefix}-description-error`,
            )}
            aria-invalid={Boolean(state.fieldErrors?.description)}
          />
          <FormFieldError id={`${idPrefix}-description-error`}>
            {state.fieldErrors?.description}
          </FormFieldError>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            Save changes
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}

function EquipmentStatusForm({ item }: { item: EquipmentItem }) {
  const [state, formAction, isPending] = useActionState(
    toggleEquipmentActiveAction.bind(null, item.id, !item.isActive),
    initialState,
  );

  return (
    <div className="grid gap-3 border-t pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div>
        <h4 className="font-medium">
          {item.isActive ? "Archive equipment" : "Reactivate equipment"}
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.isActive
            ? "Archived items stay on historical records but cannot be newly assigned."
            : "Reactivated items become available for facility assignment again."}
        </p>
      </div>
      <form action={formAction} className="grid gap-2">
        <ActionToastEffect
          state={state}
          successTitle={item.isActive ? "Equipment archived" : "Equipment reactivated"}
          errorTitle="Equipment status could not be updated"
        />
        {state.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          variant={item.isActive ? "outline" : "secondary"}
          size="sm"
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          <PendingButtonContent
            pending={isPending}
            pendingLabel={item.isActive ? "Archiving..." : "Restoring..."}
          >
            {item.isActive ? "Archive" : "Reactivate"}
          </PendingButtonContent>
        </Button>
      </form>
    </div>
  );
}

export function EquipmentItemManager({ item }: { item: EquipmentItem }) {
  return (
    <details className="group rounded-lg border bg-card">
      <summary
        className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-lg p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden"
        aria-label={`Manage ${item.name}`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{item.name}</h3>
            <StatusBadge
              kind="equipment"
              status={item.isActive ? "active" : "archived"}
            />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description || "No description."}
          </p>
        </div>
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none shadow-none",
          )}
          aria-hidden="true"
        >
          Manage
          <ChevronDown className="transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="grid gap-5 border-t p-4 sm:p-5">
        <EquipmentEditForm item={item} />
        <EquipmentStatusForm item={item} />
      </div>
    </details>
  );
}
