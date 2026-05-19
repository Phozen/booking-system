"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { CheckCircle2, RotateCcw, UserX } from "lucide-react";

import type { AdminBookingActionResult } from "@/lib/admin/bookings/actions";
import {
  markBookingCheckedInAction,
  markBookingNoShowAction,
  resetBookingUsageAction,
} from "@/lib/admin/bookings/actions";
import type { BookingUsageStatus } from "@/lib/bookings/usage";
import { formatBookingUsageStatus } from "@/lib/bookings/usage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: AdminBookingActionResult = {
  status: "idle",
  message: "",
};

function UsageActionButton({
  action,
  label,
  pendingLabel,
  variant = "outline",
  icon,
}: {
  action: (
    previousState: AdminBookingActionResult,
    formData: FormData,
  ) => Promise<AdminBookingActionResult>;
  label: string;
  pendingLabel: string;
  variant?: "outline" | "destructive" | "secondary";
  icon: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant={variant} disabled={isPending}>
        {icon}
        <PendingButtonContent pending={isPending} pendingLabel={pendingLabel}>
          {label}
        </PendingButtonContent>
      </Button>
    </form>
  );
}

export function BookingUsageActions({
  bookingId,
  usageStatus,
  canTrack,
}: {
  bookingId: string;
  usageStatus: BookingUsageStatus;
  canTrack: boolean;
}) {
  if (!canTrack) {
    return (
      <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Usage can be tracked after a booking is confirmed.
      </p>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            Usage tracking
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current usage status: {formatBookingUsageStatus(usageStatus)}.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <UsageActionButton
          action={markBookingCheckedInAction.bind(null, bookingId)}
          label="Mark checked in"
          pendingLabel="Marking..."
          icon={<CheckCircle2 data-icon="inline-start" />}
        />
        <UsageActionButton
          action={markBookingNoShowAction.bind(null, bookingId)}
          label="Mark no-show"
          pendingLabel="Marking..."
          variant="destructive"
          icon={<UserX data-icon="inline-start" />}
        />
        <UsageActionButton
          action={resetBookingUsageAction.bind(null, bookingId)}
          label="Reset tracking"
          pendingLabel="Resetting..."
          variant="secondary"
          icon={<RotateCcw data-icon="inline-start" />}
        />
      </div>
    </section>
  );
}
