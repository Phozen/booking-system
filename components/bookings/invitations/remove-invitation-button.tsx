"use client";

import { useActionState, useRef } from "react";

import { removeInvitationAction } from "@/lib/bookings/invitations/actions";
import { invitationActionInitialState } from "@/lib/bookings/invitations/action-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RemoveInvitationButton({
  invitationId,
  inviteeLabel,
}: {
  invitationId: string;
  inviteeLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    removeInvitationAction.bind(null, invitationId),
    invitationActionInitialState,
  );

  return (
    <div className="grid gap-2">
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <form ref={formRef} action={formAction}>
        <ConfirmDialog
          triggerLabel="Remove invitation"
          title="Remove this invitation?"
          description={`${inviteeLabel} will no longer be listed as an invited attendee for this booking.`}
          confirmLabel="Remove invitation"
          cancelLabel="Keep invitation"
          pendingLabel="Removing..."
          destructive
          pending={isPending}
          triggerClassName="w-full sm:w-auto"
          onConfirm={() => formRef.current?.requestSubmit()}
        />
      </form>
    </div>
  );
}
