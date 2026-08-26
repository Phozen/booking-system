"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import {
  resendBookingConfirmationAction,
  type AdminBookingActionResult,
} from "@/lib/admin/bookings/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: AdminBookingActionResult = {
  status: "idle",
  message: "",
};

export function ResendBookingConfirmationButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const action = resendBookingConfirmationAction.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        <PendingButtonContent pending={isPending} pendingLabel="Sending…">
          <Mail data-icon="inline-start" />
          Resend confirmation email
        </PendingButtonContent>
      </Button>
    </form>
  );
}
