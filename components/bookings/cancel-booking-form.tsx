"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import {
  cancelBookingAction,
  type CancellationActionResult,
} from "@/lib/bookings/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const initialState: CancellationActionResult = {
  status: "idle",
  message: "",
};

export function CancelBookingForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(
    cancelBookingAction.bind(null, bookingId),
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  if (!isExpanded) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={() => setIsExpanded(true)}
      >
        Cancel booking
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-lg border p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 text-destructive" aria-hidden="true" />
        <div>
          <h3 className="font-medium">Cancellation details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an optional reason before cancelling this booking.
          </p>
        </div>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="reason">Cancellation reason</Label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          maxLength={1000}
          disabled={isPending}
          className="min-h-24 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setIsExpanded(false)}
        >
          Keep booking
        </Button>
        <ConfirmDialog
          triggerLabel="Cancel booking"
          title="Cancel this booking?"
          description="This booking will be cancelled and the facility may become available to others. Your cancelled booking will stay visible for reference."
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          pendingLabel="Cancelling..."
          destructive
          pending={isPending}
          triggerClassName="w-full sm:w-auto"
          onConfirm={() => formRef.current?.requestSubmit()}
        />
      </div>
    </form>
  );
}
