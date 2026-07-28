import Link from "next/link";
import { CalendarDays, CheckCircle2, Edit3, ExternalLink, Printer, UserPlus } from "lucide-react";
import type { ReactNode } from "react";

import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
  isCancellableBooking,
} from "@/lib/bookings/format";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import type { BookingInvitation } from "@/lib/bookings/invitations/types";
import { formatFacilityType } from "@/lib/facilities/format";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CateringDetailsCard } from "@/components/bookings/catering-details-card";
import { CancelBookingForm } from "@/components/bookings/cancel-booking-form";
import { InvitationList } from "@/components/bookings/invitations/invitation-list";
import { InvitationResponseActions } from "@/components/bookings/invitations/invitation-response-actions";
import { StaticToastEffect } from "@/components/shared/static-toast-effect";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RouteLoadingLink } from "@/components/shared/route-loading-link";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
  viewerInvitation,
  justCreated,
  highlightInvitations,
  teamsInvitationStatus,
  teamsJoinUrl,
  calendarEventAvailable,
  calendarUnavailable,
  departments = [],
}: {
  booking: EmployeeBooking;
  viewerMode?: "owner" | "invitee";
  invitations?: BookingInvitation[];
  viewerInvitation?: BookingInvitation | null;
  justCreated?: boolean;
  highlightInvitations?: boolean;
  teamsInvitationStatus?: "pending" | "sent" | "failed" | "cancelled";
  teamsJoinUrl?: string | null;
  calendarEventAvailable?: boolean;
  calendarUnavailable?: boolean;
  departments?: import("@/lib/departments/queries").Department[];
}) {
  const approval = booking.approvals[0];
  const isOwnerView = viewerMode === "owner";
  const invitationResponses = {
    accepted: invitations.filter((invitation) => invitation.status === "accepted").length,
    pending: invitations.filter((invitation) => invitation.status === "pending").length,
    declined: invitations.filter((invitation) => invitation.status === "declined").length,
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          isOwnerView
            ? { label: "My Bookings", href: "/my-bookings" }
            : { label: "Invitations", href: "/invitations" },
          { label: booking.title },
        ]}
      />

      <header>
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
          <div className="mt-5 flex flex-wrap gap-2">
            {teamsJoinUrl ? (
              <a
                href={teamsJoinUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  variant: "default",
                  className:
                    "w-full border-[#5b5fc7] bg-[#5b5fc7] text-white shadow-[#5b5fc7]/25 hover:bg-[#464775] focus-visible:border-[#7b83eb] focus-visible:ring-[#7b83eb]/25 dark:bg-[#7b83eb] dark:text-slate-950 dark:hover:bg-[#959cf4] sm:w-auto",
                })}
            >
              <ExternalLink data-icon="inline-start" />
              Join Teams Meeting
              </a>
            ) : null}
            {calendarEventAvailable ? (
              <Link
                href={`/bookings/${booking.id}/calendar`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  variant: "default",
                  className:
                    "w-full border-sky-700/70 bg-sky-600 text-white shadow-sky-700/20 hover:bg-sky-700 focus-visible:border-sky-500 focus-visible:ring-sky-500/25 dark:bg-sky-500 dark:text-sky-950 dark:hover:bg-sky-400 sm:w-auto",
                })}
              >
                <CalendarDays data-icon="inline-start" />
                View Outlook Calendar
              </Link>
            ) : null}
            {isOwnerView ? (
              <>
                {booking.status === "pending" || booking.status === "confirmed" ? (
                  <RouteLoadingLink
                    href={`/bookings/${booking.id}/edit`}
                    loadingLabel="Loading edit form..."
                    loadingVariant="form"
                    className={buttonVariants({
                      variant: "warning",
                      className: "w-full text-white hover:text-white dark:text-white sm:w-auto",
                    })}
                  >
                    <Edit3 data-icon="inline-start" />
                    Edit
                  </RouteLoadingLink>
                ) : null}
                <Link
                  href={`/bookings/${booking.id}/print`}
                  className={buttonVariants({
                    variant: "default",
                    className:
                      "w-full border-violet-700/70 bg-violet-600 text-white shadow-violet-700/20 hover:bg-violet-700 focus-visible:border-violet-500 focus-visible:ring-violet-500/25 dark:bg-violet-500 dark:text-violet-950 dark:hover:bg-violet-400 sm:w-auto",
                  })}
                >
                  <Printer data-icon="inline-start" />
                  Print Form
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {calendarUnavailable ? (
        <Alert variant="warning">
          <AlertTitle>Outlook event unavailable</AlertTitle>
          <AlertDescription>
            The Outlook event is not ready or is no longer available. Your room booking is unchanged.
          </AlertDescription>
        </Alert>
      ) : null}

      {isOwnerView && justCreated ? (
        <Alert variant="success">
          <StaticToastEffect
            title={
              booking.status === "pending"
                ? "Booking request submitted"
                : "Booking created"
            }
            description={
              booking.status === "pending"
                ? "Booking request submitted and pending approval."
                : "Booking created."
            }
          />
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>
            {booking.status === "pending"
              ? "Booking request submitted"
              : "Booking created"}
          </AlertTitle>
          <AlertDescription className="grid gap-3">
            <span>
              {booking.status === "pending"
                ? "Booking request submitted and pending approval."
                : "Booking created."}{" "}
              You can add attendees and departments from this page whenever needed.
            </span>
            <span className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="#booking-participants"
                className={buttonVariants({
                  size: "sm",
                  className: "w-full sm:w-auto",
                })}
              >
                <UserPlus data-icon="inline-start" />
                Manage participants
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

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
          <DetailItem label="Meeting type">
            {booking.teamsMeeting
              ? booking.status !== "confirmed"
                ? "Teams invitation pending room confirmation"
                : teamsInvitationStatus === "sent"
                  ? "Teams invitation sent through Outlook"
                  : teamsInvitationStatus === "failed"
                    ? "Room confirmed; Teams invitation pending"
                    : teamsInvitationStatus === "cancelled"
                      ? "Teams invitation cancelled"
                      : "Room confirmed; Teams invitation pending"
              : "Room only"}
          </DetailItem>
          <DetailItem label="Internal invitations">
            {invitations.length > 0
              ? `${invitations.length} invited — ${invitationResponses.accepted} accepted, ${invitationResponses.pending} pending, ${invitationResponses.declined} declined`
              : "No internal attendees invited"}
          </DetailItem>
          <DetailItem label="Approval">
            {booking.approvalRequired
              ? formatApprovalStatus(approval)
              : "Not required"}
          </DetailItem>
          <DetailItem label="Created">
            {formatBookingDateTime(booking.createdAt)}
          </DetailItem>
        </dl>
      </section>

      <CateringDetailsCard catering={booking.catering} />

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
          canManage
          highlight={highlightInvitations}
          departments={departments}
          selectedDepartmentIds={booking.departments.map((department) => department.id)}
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
