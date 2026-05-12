"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";

import { inviteUserToBookingAction } from "@/lib/bookings/invitations/actions";
import { invitationActionInitialState } from "@/lib/bookings/invitations/action-state";
import type { InviteCandidate } from "@/lib/bookings/invitations/types";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function InviteUserForm({
  bookingId,
  candidates,
}: {
  bookingId: string;
  candidates: InviteCandidate[];
}) {
  const [state, formAction, isPending] = useActionState(
    inviteUserToBookingAction,
    invitationActionInitialState,
  );
  const fieldId = "invited-user-id";
  const helperId = `${fieldId}-helper`;

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border bg-card p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-2">
        <Label htmlFor={fieldId}>Invite an active internal user</Label>
        <select
          id={fieldId}
          name="invitedUserId"
          required
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby={helperId}
          disabled={isPending || candidates.length === 0}
          defaultValue=""
        >
          <option value="" disabled>
            {candidates.length > 0 ? "Select a user" : "No users available"}
          </option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.fullName ? `${candidate.fullName} - ${candidate.email}` : candidate.email}
            </option>
          ))}
        </select>
        <FormFieldHelper id={helperId}>
          Disabled, pending, duplicate, and owner accounts cannot be invited.
        </FormFieldHelper>
      </div>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isPending || candidates.length === 0}>
        <UserPlus data-icon="inline-start" />
        {isPending ? "Inviting..." : "Invite user"}
      </Button>
    </form>
  );
}
