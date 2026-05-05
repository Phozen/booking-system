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
import { formatFacilityType } from "@/lib/facilities/format";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CancelBookingForm } from "@/components/bookings/cancel-booking-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
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

export function BookingDetail({ booking }: { booking: EmployeeBooking }) {
  const approval = booking.approvals[0];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-3">
        <Breadcrumbs
          items={[
            { label: "My Bookings", href: "/my-bookings" },
            { label: booking.title },
          ]}
        />
        <Link
          href="/my-bookings"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          My Bookings
        </Link>
      </div>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BookingStatusBadge status={booking.status} />
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

      <section className="rounded-lg border bg-card p-5">
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
            {booking.facility ? formatFacilityType(booking.facility.type) : "Unavailable"}
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

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">Description</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {booking.description || "No description was provided."}
        </p>
      </section>

      {booking.cancellationReason ? (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-normal">
            Cancellation reason
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {booking.cancellationReason}
          </p>
        </section>
      ) : null}

      {isCancellableBooking(booking.status) ? (
        <section className="grid gap-4 rounded-lg border border-destructive/30 bg-card p-5">
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
