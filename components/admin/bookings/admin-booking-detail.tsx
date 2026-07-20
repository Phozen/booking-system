import Link from "next/link";
import { ArrowLeft, Mail, Printer } from "lucide-react";
import type { ReactNode } from "react";

import {
  adminCancelBookingAction,
  approveBookingAction,
  rejectBookingAction,
} from "@/lib/admin/bookings/actions";
import type { AdminBooking } from "@/lib/admin/bookings/queries";
import type { BookingInvitation } from "@/lib/bookings/invitations/types";
import { canTrackBookingUsage, formatBookingUsageStatus } from "@/lib/bookings/usage";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
  isCancellableBooking,
} from "@/lib/bookings/format";
import { formatFacilityType } from "@/lib/facilities/format";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CateringDetailsCard } from "@/components/bookings/catering-details-card";
import { CateringEditForm } from "@/components/bookings/catering-edit-form";
import { InvitationList } from "@/components/bookings/invitations/invitation-list";
import { AdminBookingActionForm } from "@/components/admin/bookings/admin-booking-action-form";
import { BookingUsageActions } from "@/components/admin/bookings/booking-usage-actions";
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

export function AdminBookingDetail({
  booking,
  invitations = [],
}: {
  booking: AdminBooking;
  invitations?: BookingInvitation[];
}) {
  const approval = booking.approvals[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href="/admin/bookings"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Bookings
        </Link>
      </div>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Admin booking detail
          </p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-normal sm:text-3xl">
            {booking.title}
          </h1>
          <div className="mt-3">
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>
        <Link
          href={`/admin/bookings/${booking.id}/print`}
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <Printer data-icon="inline-start" />
          Print approval form
        </Link>
      </header>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">
          Booking information
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Date">
            {formatBookingDate(booking.startsAt)}
          </DetailItem>
          <DetailItem label="Time">
            {formatBookingWindow(booking.startsAt, booking.endsAt)}
          </DetailItem>
          <DetailItem label="Attendee count">
            {booking.attendeeCount ?? "Not provided"}
          </DetailItem>
          <DetailItem label="Usage status">
            {formatBookingUsageStatus(booking.usageStatus)}
          </DetailItem>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">Involved departments</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Department mailboxes receive booking confirmation and cancellation updates.
        </p>
        {booking.departments.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {booking.departments.map((department) => (
              <li key={department.id} className="rounded-lg border bg-muted/30 p-3">
                <p className="font-medium">{department.name}</p>
                <p className="mt-1 flex min-w-0 items-center gap-2 break-all text-sm text-muted-foreground">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {department.email}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No departments were tagged for this booking.</p>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">Facility</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name">
              {booking.facility?.name ?? "Unavailable"}
            </DetailItem>
            <DetailItem label="Level">
              {booking.facility?.level ?? "Unavailable"}
            </DetailItem>
            <DetailItem label="Type">
              {booking.facility
                ? formatFacilityType(booking.facility.type)
                : "Unavailable"}
            </DetailItem>
            <DetailItem label="Code">
              {booking.facility?.code ?? "Unavailable"}
            </DetailItem>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">User</h2>
          <dl className="mt-5 grid gap-5">
            <DetailItem label="Name">
              {booking.user?.fullName || "Not provided"}
            </DetailItem>
            <DetailItem label="Email">
              {booking.user?.email ?? "Unavailable"}
            </DetailItem>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">Description</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {booking.description || "No description was provided."}
        </p>
      </section>

      <CateringDetailsCard catering={booking.catering} />

      <CateringEditForm
        bookingId={booking.id}
        catering={booking.catering}
        canEdit
        lockedMessage=""
      />

      <InvitationList
        bookingId={booking.id}
        invitations={invitations}
        canManage={false}
      />

      <BookingUsageActions
        bookingId={booking.id}
        usageStatus={booking.usageStatus}
        canTrack={canTrackBookingUsage(booking.status)}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">Approval</h2>
          <dl className="mt-5 grid gap-5">
            <DetailItem label="Status">
              {approval?.status ?? (booking.approvalRequired ? "Pending" : "Not required")}
            </DetailItem>
            <DetailItem label="Requested">
              {approval ? formatBookingDateTime(approval.requestedAt) : "Unavailable"}
            </DetailItem>
            <DetailItem label="Reviewed">
              {approval?.reviewedAt
                ? formatBookingDateTime(approval.reviewedAt)
                : "Not reviewed"}
            </DetailItem>
            <DetailItem label="Remarks">
              {approval?.remarks || "None"}
            </DetailItem>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">
            Cancellation
          </h2>
          <dl className="mt-5 grid gap-5">
            <DetailItem label="Cancelled">
              {booking.cancelledAt
                ? formatBookingDateTime(booking.cancelledAt)
                : "Not cancelled"}
            </DetailItem>
            <DetailItem label="Reason">
              {booking.cancellationReason || "None"}
            </DetailItem>
          </dl>
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="text-lg font-semibold tracking-normal">Admin actions</h2>

        {booking.status === "pending" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminBookingActionForm
              title="Approve booking"
              description="Re-checks active booking conflicts before confirming."
              label="Approval remarks"
              submitLabel="Approve booking"
              action={approveBookingAction.bind(null, booking.id)}
            />
            <AdminBookingActionForm
              title="Reject booking"
              description="Rejects the pending request and queues a rejection email record."
              label="Rejection remarks"
              submitLabel="Reject booking"
              variant="destructive"
              action={rejectBookingAction.bind(null, booking.id)}
              confirmation={{
                title: "Reject this booking request?",
                description:
                  "The booking will be marked as rejected. The requester may receive a rejection notification, and the request cannot be approved afterward.",
                confirmLabel: "Reject booking",
                cancelLabel: "Keep pending",
                pendingLabel: "Rejecting...",
              }}
            />
          </div>
        ) : null}

        {isCancellableBooking(booking.status) ? (
          <AdminBookingActionForm
            title="Cancel booking"
            description="Cancels this booking and queues a cancellation email record for the booking owner."
            label="Cancellation reason"
            submitLabel="Cancel booking"
            variant="destructive"
            action={adminCancelBookingAction.bind(null, booking.id)}
            confirmation={{
              title: "Cancel this user's booking?",
              description:
                "This cancels another user's booking. The requester may receive a cancellation notification, and the facility time may become available to others.",
              confirmLabel: "Cancel booking",
              cancelLabel: "Keep booking",
              pendingLabel: "Cancelling...",
            }}
          />
        ) : null}

        {!isCancellableBooking(booking.status) ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No admin actions are available for this booking status.
          </p>
        ) : null}
      </section>
    </main>
  );
}
