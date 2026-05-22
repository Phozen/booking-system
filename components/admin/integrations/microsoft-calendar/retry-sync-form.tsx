"use client";

import { useActionState } from "react";
import { RefreshCcw } from "lucide-react";

import {
  retryMicrosoftCalendarSyncAction,
  type MicrosoftCalendarRetryActionResult,
} from "@/lib/admin/integrations/microsoft-calendar/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";

const initialState: MicrosoftCalendarRetryActionResult = {
  status: "idle",
  message: "",
};

export function RetryMicrosoftCalendarSyncForm({
  bookingId,
}: {
  bookingId: string;
}) {
  const [state, formAction, pending] = useActionState(
    retryMicrosoftCalendarSyncAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <ActionToastEffect
        state={state}
        successTitle="Microsoft Calendar sync retried"
        errorTitle="Microsoft Calendar retry failed"
      />
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <PendingButtonContent pending={pending} pendingLabel="Retrying...">
          <RefreshCcw aria-hidden="true" />
          Retry sync
        </PendingButtonContent>
      </Button>
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
