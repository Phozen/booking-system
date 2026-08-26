"use client";

import { useActionState } from "react";

import {
  updateNotificationPreferencesAction,
  type NotificationPreferencesActionResult,
} from "@/lib/notifications/actions";
import type { UserNotificationPreferences } from "@/lib/notifications/preferences";
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
      <ActionToastEffect
        state={state}
        successTitle="Preferences saved"
        errorTitle="Preferences not saved"
      />

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="grid gap-4" disabled={isPending}>
        <legend className="sr-only">Notification preferences</legend>

        <div className="flex gap-3 rounded-lg border bg-muted/30 p-4">
          <input
            id="bookingRemindersEnabled"
            type="checkbox"
            name="bookingRemindersEnabled"
            defaultChecked={preferences.bookingRemindersEnabled}
            className="mt-1 size-4 accent-primary"
            aria-describedby="bookingRemindersEnabled-helper"
          />
          <div>
            <label htmlFor="bookingRemindersEnabled" className="block font-medium">
              Booking reminders
            </label>
            <p
              id="bookingRemindersEnabled-helper"
              className="mt-1 text-sm text-muted-foreground"
            >
              Receive non-critical reminders before confirmed bookings.
            </p>
          </div>
        </div>

        {INTERNAL_INVITES_ENABLED ? (
          <div className="flex gap-3 rounded-lg border bg-muted/30 p-4">
            <input
              id="invitationUpdatesEnabled"
              type="checkbox"
              name="invitationUpdatesEnabled"
              defaultChecked={preferences.invitationUpdatesEnabled}
              className="mt-1 size-4 accent-primary"
              aria-describedby="invitationUpdatesEnabled-helper"
            />
            <div>
              <label htmlFor="invitationUpdatesEnabled" className="block font-medium">
                Invitation updates
              </label>
              <p
                id="invitationUpdatesEnabled-helper"
                className="mt-1 text-sm text-muted-foreground"
              >
                Receive non-critical updates when invitations are accepted or
                declined.
              </p>
            </div>
          </div>
        ) : null}
      </fieldset>

      <p className="text-sm text-muted-foreground">
        Critical booking approval, rejection, cancellation, and account messages
        are still sent when configured.
      </p>

      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isPending}>
          <PendingButtonContent pending={isPending} pendingLabel="Saving...">
            Save preferences
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
