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
import { PageHeader } from "@/components/shared/page-header";
import { RouteLoadingLink } from "@/components/shared/route-loading-link";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="qbook-type-meta">{label}</dt>
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
  const canEdit =
    isOwnerView &&
    (booking.status === "pending" || booking.status === "confirmed");
  const facilityLine = booking.facility
    ? `${booking.facility.name}, ${booking.facility.level}`
    : "Room unavailable";

  const primaryAction = !isOwnerView && viewerInvitation?.status === "pending" ? (
    <InvitationResponseActions invitationId={viewerInvitation.id} />
  ) : canEdit ? (
    <RouteLoadingLink
      href={`/bookings/${booking.id}/edit`}
      loadingLabel="Loading edit form..."
      loadingVariant="form"
      className={buttonVariants({ size: "lg", className: "w-full min-h-11 sm:w-auto" })}
    >
      <Edit3 data-icon="inline-start" />
      Edit booking
    </RouteLoadingLink>
  ) : teamsJoinUrl ? (
    <a
      href={teamsJoinUrl}
      target="_blank"
      rel="noreferrer"
      className={buttonVariants({ className: "w-full sm:w-auto" })}
    >
      <ExternalLink data-icon="inline-start" />
      Join Teams meeting
    </a>
  ) : null;

  const teamsIsPrimary = Boolean(teamsJoinUrl && !canEdit && !(
    !isOwnerView && viewerInvitation?.status === "pending"
  ));

  const secondaryActions = (
    <div className="flex flex-wrap gap-2">
      {teamsJoinUrl && !teamsIsPrimary ? (
        <a
          href={teamsJoinUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <ExternalLink data-icon="inline-start" />
          Join Teams
        </a>
      ) : null}
      {calendarEventAvailable ? (
        <Link
          href={`/bookings/${booking.id}/calendar`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <CalendarDays data-icon="inline-start" />
          Outlook calendar
        </Link>
      ) : null}
      {isOwnerView ? (
        <Link
          href={`/bookings/${booking.id}/print`}
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <Printer data-icon="inline-start" />
          Print form
        </Link>
      ) : null}
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        breadcrumbs={[
          isOwnerView
            ? {
                label: "My bookings",
                href: `/my-bookings?highlight=${booking.id}`,
              }
            : { label: "Invites", href: "/invitations" },
          { label: booking.title },
        ]}
        title={booking.title}
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <BookingStatusBadge status={booking.status} />
              {!isOwnerView && viewerInvitation ? (
                <StatusBadge kind="invitation" status={viewerInvitation.status} />
              ) : null}
            </span>
            <span>
              {facilityLine}
              {" · "}
              <span className="qbook-type-tabular">
                {formatBookingDate(booking.startsAt)} ·{" "}
                {formatBookingWindow(booking.startsAt, booking.endsAt)}
              </span>
            </span>
          </span>
        }
        primaryAction={primaryAction}
        secondaryAction={
          isOwnerView || calendarEventAvailable || teamsJoinUrl
            ? secondaryActions
            : undefined
        }
      />

      {calendarUnavailable ? (
        <Alert variant="warning">
          <AlertTitle>Outlook event unavailable</AlertTitle>
          <AlertDescription>
            The Outlook event is not ready or is no longer available. Your room
            booking is unchanged.
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
            <span>
              <Link
                href="#booking-participants"
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
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

      {!isOwnerView && viewerInvitation && viewerInvitation.status !== "pending" ? (
        <section className="rounded-lg border border-border bg-muted/30 p-5">
          <h2 className="qbook-type-section">Your invitation</h2>
          <p className="qbook-type-meta mt-2">
            Your response is recorded as{" "}
            <span className="font-medium text-foreground">
              {viewerInvitation.status}
            </span>
            . Only the organizer can cancel or manage the booking.
          </p>
        </section>
      ) : null}

      {!isOwnerView && viewerInvitation?.status === "pending" ? (
        <p className="qbook-type-meta">
          You can view this booking because you were invited. Only the organizer
          can cancel or manage the booking.
        </p>
      ) : null}

      <section className="grid gap-4 border-t border-border pt-6">
        <h2 className="qbook-type-section">Booking details</h2>
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Room">
            {booking.facility?.name ?? "Room unavailable"}
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
            <span className="qbook-type-tabular">
              {formatBookingDate(booking.startsAt)}
            </span>
          </DetailItem>
          <DetailItem label="Time">
            <span className="qbook-type-tabular">
              {formatBookingWindow(booking.startsAt, booking.endsAt)}
            </span>
          </DetailItem>
          <DetailItem label="How many people">
            <span className="qbook-type-tabular">
              {booking.attendeeCount ?? "Not provided"}
            </span>
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
            <span className="qbook-type-tabular">
              {formatBookingDateTime(booking.createdAt)}
            </span>
          </DetailItem>
        </dl>
      </section>

      <CateringDetailsCard catering={booking.catering} />

      <section className="grid gap-3 border-t border-border pt-6">
        <h2 className="qbook-type-section">Description</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {booking.description || "No description was provided."}
        </p>
      </section>

      {booking.cancellationReason ? (
        <section className="grid gap-3 border-t border-border pt-6">
          <h2 className="qbook-type-section">Cancellation reason</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {booking.cancellationReason}
          </p>
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
        <section
          className={cn(
            "mt-2 grid gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5",
          )}
        >
          <div>
            <h2 className="qbook-type-section">Cancel booking</h2>
            <p className="qbook-type-meta mt-2">
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
