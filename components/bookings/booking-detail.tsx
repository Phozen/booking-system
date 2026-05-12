import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import type { ReactNode } from "react";

import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
  isCancellableBooking,
} from "@/lib/bookings/format";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import type {
  BookingInvitation,
  InviteCandidate,
} from "@/lib/bookings/invitations/types";
import { formatFacilityType } from "@/lib/facilities/format";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CancelBookingForm } from "@/components/bookings/cancel-booking-form";
import { InvitationList } from "@/components/bookings/invitations/invitation-list";
import { InvitationResponseActions } from "@/components/bookings/invitations/invitation-response-actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

function formatApprovalStatus(approval?: EmployeeBooking["approvals"][number]) {
  if (!approval) {
    return "Required";
  }

  const labels: Record<typeof approval.status, string> = {
    pending: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
  };

  return labels[approval.status];
}

export function BookingDetail({
  booking,
  viewerMode = "owner",
  invitations = [],
  inviteCandidates = [],
  viewerInvitation,
}: {
  booking: EmployeeBooking;
  viewerMode?: "owner" | "invitee";
  invitations?: BookingInvitation[];
  inviteCandidates?: InviteCandidate[];
  viewerInvitation?: BookingInvitation | null;
}) {
  const approval = booking.approvals[0];
  const isOwnerView = viewerMode === "owner";

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-3">
        <Breadcrumbs
          items={[
            isOwnerView
              ? { label: "My Bookings", href: "/my-bookings" }
              : { label: "Invitations", href: "/invitations" },
            { label: booking.title },
          ]}
        />
        <Link
          href={isOwnerView ? "/my-bookings" : "/invitations"}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {isOwnerView ? "My Bookings" : "Invitations"}
        </Link>
      </div>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BookingStatusBadge status={booking.status} />
          {!isOwnerView && viewerInvitation ? (
            <StatusBadge
              kind="invitation"
              status={viewerInvitation.status}
              className="ml-2"
            />
          ) : null}
          <h1 className="mt-3 break-words text-2xl font-semibold tracking-normal sm:text-3xl">
            {booking.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {booking.facility
              ? `${booking.facility.name}, ${booking.facility.level}`
              : "Facility unavailable"}
          </p>
        </div>

        <Link
          href="/bookings/new"
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <CalendarPlus data-icon="inline-start" />
          Create another booking
        </Link>
      </header>

      <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
        <h2 className="text-lg font-semibold tracking-normal">
          Booking details
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem label="Facility">
            {booking.facility?.name ?? "Facility unavailable"}
          </DetailItem>
          <DetailItem label="Level">
            {booking.facility?.level ?? "Unavailable"}
          </DetailItem>
          <DetailItem label="Type">
            {booking.facility
              ? formatFacilityType(booking.facility.type)
              : "Unavailable"}
          </DetailItem>
          <DetailItem label="Date">
            {formatBookingDate(booking.startsAt)}
          </DetailItem>
          <DetailItem label="Time">
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </DetailItem>
          <DetailItem label="Attendee count">
            {booking.attendeeCount ?? "Not provided"}
          </DetailItem>
          <DetailItem label="Approval">
            {booking.approvalRequired
              ? formatApprovalStatus(approval)
              : "Not required"}
          </DetailItem>
          <DetailItem label="Created">
            {formatBookingDateTime(booking.createdAt)}
          </DetailItem>
          <DetailItem label="Updated">
            {formatBookingDateTime(booking.updatedAt)}
          </DetailItem>
          <DetailItem label="Cancellation status">
            {booking.cancelledAt
              ? `Cancelled ${formatBookingDateTime(booking.cancelledAt)}`
              : "Not cancelled"}
          </DetailItem>
        </dl>
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
        <h2 className="text-lg font-semibold tracking-normal">Description</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {booking.description || "No description was provided."}
        </p>
      </section>

      {booking.cancellationReason ? (
        <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm shadow-primary/5 ring-1 ring-primary/10">
          <h2 className="text-lg font-semibold tracking-normal">
            Cancellation reason
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {booking.cancellationReason}
          </p>
        </section>
      ) : null}

      {!isOwnerView && viewerInvitation ? (
        <section className="grid gap-4 rounded-lg border border-sky-200 bg-sky-50/70 p-5 text-sky-950 shadow-sm shadow-sky-500/10 ring-1 ring-sky-200/60 dark:border-sky-800 dark:bg-sky-950/25 dark:text-sky-100">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              Your invitation
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You can view this booking because you were invited. Only the
              organizer can cancel or manage the booking.
            </p>
          </div>
          {viewerInvitation.status === "pending" ? (
            <InvitationResponseActions invitationId={viewerInvitation.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Your response is recorded as{" "}
              <span className="font-medium text-foreground">
                {viewerInvitation.status}
              </span>
              .
            </p>
          )}
        </section>
      ) : null}

      {isOwnerView ? (
        <InvitationList
          bookingId={booking.id}
          invitations={invitations}
          candidates={inviteCandidates}
          canManage
        />
      ) : null}

      {isOwnerView && isCancellableBooking(booking.status) ? (
        <section className="grid gap-4 rounded-lg border border-destructive/35 bg-rose-50/60 p-5 text-rose-950 shadow-sm shadow-rose-500/10 ring-1 ring-rose-200/60 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              Cancel booking
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Only cancel when you no longer need the room. The selected time may
              become available to other employees.
            </p>
          </div>
          <CancelBookingForm bookingId={booking.id} />
        </section>
      ) : null}
    </main>
  );
}
