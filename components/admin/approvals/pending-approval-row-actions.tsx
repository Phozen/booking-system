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

function RejectRemarksFields({
  bookingId,
  disabled,
  onRemarksChange,
}: {
  bookingId: string;
  disabled: boolean;
  onRemarksChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <p>
        The booking will be marked as rejected. The requester may receive a
        rejection notification.
      </p>
      <div className="grid gap-2 text-left">
        <Label htmlFor={`reject-remarks-field-${bookingId}`}>
          Rejection remarks (optional)
        </Label>
        <Textarea
          id={`reject-remarks-field-${bookingId}`}
          rows={3}
          maxLength={1000}
          disabled={disabled}
          onChange={(event) => onRemarksChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function PendingApprovalRowActions({
  bookingId,
  variant = "table",
}: {
  bookingId: string;
  variant?: "table" | "card";
}) {
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

  function setRejectRemarks(value: string) {
    const hidden = rejectFormRef.current?.querySelector<HTMLInputElement>(
      'input[name="remarks"]',
    );
    if (hidden) {
      hidden.value = value;
    }
  }

  const feedbackAlert = feedback ? (
    <Alert
      variant={feedback.status === "error" ? "destructive" : "success"}
      className="py-2"
    >
      <AlertDescription className="text-xs">{feedback.message}</AlertDescription>
    </Alert>
  ) : null;

  const approveButton = (
    <form action={approveAction} className="w-full">
      <input type="hidden" name="remarks" value="" />
      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        className="w-full"
      >
        <PendingButtonContent
          pending={approvePending}
          pendingLabel="Approving..."
        >
          <Check data-icon="inline-start" />
          Approve
        </PendingButtonContent>
      </Button>
    </form>
  );

  const rejectButton = (
    <form ref={rejectFormRef} action={rejectAction} className="w-full">
      <input type="hidden" name="remarks" defaultValue="" />
      <ConfirmDialog
        triggerLabel="Reject"
        title="Reject this booking request?"
        description={
          <RejectRemarksFields
            bookingId={bookingId}
            disabled={isPending}
            onRemarksChange={setRejectRemarks}
          />
        }
        confirmLabel="Reject booking"
        cancelLabel="Keep pending"
        pendingLabel="Rejecting..."
        destructive
        pending={rejectPending}
        disabled={isPending}
        triggerSize="sm"
        triggerClassName="w-full"
        onConfirm={() => rejectFormRef.current?.requestSubmit()}
      />
    </form>
  );

  const openLink = (
    <Link
      href={`/admin/bookings/${bookingId}`}
      className={buttonVariants({
        variant: "outline",
        size: "sm",
        className: "w-full",
      })}
    >
      <Eye data-icon="inline-start" />
      Open
    </Link>
  );

  // Card: fragment so MobileRecordCard can stack each action full-width.
  if (variant === "card") {
    return (
      <>
        {feedbackAlert}
        {approveButton}
        {rejectButton}
        {openLink}
      </>
    );
  }

  // Table: fixed-width vertical stack — never wraps into a staggered row.
  return (
    <div className="grid w-36 gap-2 justify-self-end">
      {feedbackAlert}
      {approveButton}
      {rejectButton}
      {openLink}
    </div>
  );
}
