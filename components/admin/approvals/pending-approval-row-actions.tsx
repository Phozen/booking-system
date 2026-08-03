"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Check, Eye } from "lucide-react";

import {
  approveBookingAction,
  rejectBookingAction,
  type AdminBookingActionResult,
} from "@/lib/admin/bookings/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: AdminBookingActionResult = {
  status: "idle",
  message: "",
};

export function PendingApprovalRowActions({ bookingId }: { bookingId: string }) {
  const rejectFormRef = useRef<HTMLFormElement>(null);
  const [approveState, approveAction, approvePending] = useActionState(
    approveBookingAction.bind(null, bookingId),
    initialState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectBookingAction.bind(null, bookingId),
    initialState,
  );
  const isPending = approvePending || rejectPending;
  const feedback =
    approveState.status !== "idle"
      ? approveState
      : rejectState.status !== "idle"
        ? rejectState
        : null;

  return (
    <div className="grid gap-2">
      {feedback ? (
        <Alert
          variant={feedback.status === "error" ? "destructive" : "success"}
          className="py-2"
        >
          <AlertDescription className="text-xs">{feedback.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <form action={approveAction}>
          <input type="hidden" name="remarks" value="" />
          <Button type="submit" size="sm" disabled={isPending} className="min-w-24">
            <PendingButtonContent
              pending={approvePending}
              pendingLabel="Approving..."
            >
              <Check data-icon="inline-start" />
              Approve
            </PendingButtonContent>
          </Button>
        </form>

        <form ref={rejectFormRef} action={rejectAction} className="contents">
          <input type="hidden" name="remarks" defaultValue="" />
          <ConfirmDialog
            triggerLabel="Reject"
            title="Reject this booking request?"
            description={
              <div className="grid gap-3">
                <p>
                  The booking will be marked as rejected. The requester may
                  receive a rejection notification.
                </p>
                <div className="grid gap-2 text-left">
                  <Label htmlFor={`reject-remarks-field-${bookingId}`}>
                    Rejection remarks (optional)
                  </Label>
                  <Textarea
                    id={`reject-remarks-field-${bookingId}`}
                    rows={3}
                    maxLength={1000}
                    disabled={isPending}
                    onChange={(event) => {
                      const hidden =
                        rejectFormRef.current?.querySelector<HTMLInputElement>(
                          'input[name="remarks"]',
                        );
                      if (hidden) {
                        hidden.value = event.target.value;
                      }
                    }}
                  />
                </div>
              </div>
            }
            confirmLabel="Reject booking"
            cancelLabel="Keep pending"
            pendingLabel="Rejecting..."
            destructive
            pending={rejectPending}
            disabled={isPending}
            triggerClassName="min-w-24"
            onConfirm={() => rejectFormRef.current?.requestSubmit()}
          />
        </form>

        <Link
          href={`/admin/bookings/${bookingId}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <Eye data-icon="inline-start" />
          Open
        </Link>
      </div>
    </div>
  );
}
