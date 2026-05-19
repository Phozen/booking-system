"use client";

import { useActionState } from "react";

import {
  updateNotificationPreferencesAction,
  type NotificationPreferencesActionResult,
} from "@/lib/notifications/actions";
import type { UserNotificationPreferences } from "@/lib/notifications/preferences";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: NotificationPreferencesActionResult = {
  status: "idle",
  message: "",
};

export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: UserNotificationPreferences;
}) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferencesAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <label className="flex gap-3 rounded-lg border bg-muted/30 p-4">
        <input
          type="checkbox"
          name="bookingRemindersEnabled"
          defaultChecked={preferences.bookingRemindersEnabled}
          disabled={isPending}
          className="mt-1 size-4 accent-primary"
        />
        <span>
          <span className="block font-medium">Booking reminders</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Receive non-critical reminders before confirmed bookings.
          </span>
        </span>
      </label>

      <label className="flex gap-3 rounded-lg border bg-muted/30 p-4">
        <input
          type="checkbox"
          name="invitationUpdatesEnabled"
          defaultChecked={preferences.invitationUpdatesEnabled}
          disabled={isPending}
          className="mt-1 size-4 accent-primary"
        />
        <span>
          <span className="block font-medium">Invitation updates</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Receive non-critical updates when invitations are accepted or
            declined.
          </span>
        </span>
      </label>

      <p className="text-sm text-muted-foreground">
        Critical booking approval, rejection, cancellation, and account messages
        are still sent when configured.
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            Save preferences
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
