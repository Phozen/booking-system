"use client";

import { useActionState, useRef } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import type { AdminBookingActionResult } from "@/lib/admin/bookings/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const initialState: AdminBookingActionResult = {
  status: "idle",
  message: "",
};

type ConfirmationCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel?: string;
};

export function AdminBookingActionForm({
  title,
  description,
  label,
  submitLabel,
  variant = "default",
  action,
  confirmation,
}: {
  title: string;
  description: string;
  label: string;
  submitLabel: string;
  variant?: "default" | "destructive";
  action: (
    previousState: AdminBookingActionResult,
    formData: FormData,
  ) => Promise<AdminBookingActionResult>;
  confirmation?: ConfirmationCopy;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-lg border p-4"
    >
      <div className="flex items-start gap-3">
        {variant === "destructive" ? (
          <XCircle className="mt-0.5 size-4 text-destructive" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 text-primary" aria-hidden="true" />
        )}
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={`${submitLabel}-remarks`}>{label}</Label>
        <textarea
          id={`${submitLabel}-remarks`}
          name="remarks"
          rows={4}
          maxLength={1000}
          disabled={isPending}
          className="min-h-24 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
        />
      </div>

      <div className="grid sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {confirmation ? (
          <ConfirmDialog
            triggerLabel={submitLabel}
            title={confirmation.title}
            description={confirmation.description}
            confirmLabel={confirmation.confirmLabel}
            cancelLabel={confirmation.cancelLabel}
            pendingLabel={confirmation.pendingLabel}
            destructive={variant === "destructive"}
            pending={isPending}
            triggerClassName="w-full sm:w-auto"
            onConfirm={() => formRef.current?.requestSubmit()}
          />
        ) : (
          <Button type="submit" variant={variant} disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
