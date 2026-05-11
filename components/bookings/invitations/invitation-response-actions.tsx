"use client";

import { useActionState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import {
  invitationActionInitialState,
  respondToInvitationAction,
} from "@/lib/bookings/invitations/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function InvitationResponseActions({
  invitationId,
  disabled,
}: {
  invitationId: string;
  disabled?: boolean;
}) {
  const [acceptState, acceptAction, acceptPending] = useActionState(
    respondToInvitationAction.bind(null, invitationId, "accepted"),
    invitationActionInitialState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    respondToInvitationAction.bind(null, invitationId, "declined"),
    invitationActionInitialState,
  );
  const result =
    acceptState.status !== "idle"
      ? acceptState
      : declineState.status !== "idle"
        ? declineState
        : null;
  const isPending = acceptPending || declinePending;

  return (
    <div className="grid gap-3">
      {result ? (
        <Alert variant={result.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={acceptAction} className="w-full sm:w-auto">
          <Button
            type="submit"
            variant="success"
            className="w-full"
            disabled={disabled || isPending}
          >
            <CheckCircle2 data-icon="inline-start" />
            {acceptPending ? "Accepting..." : "Accept invitation"}
          </Button>
        </form>
        <form action={declineAction} className="w-full sm:w-auto">
          <Button
            type="submit"
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled || isPending}
          >
            <XCircle data-icon="inline-start" />
            {declinePending ? "Declining..." : "Decline invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
