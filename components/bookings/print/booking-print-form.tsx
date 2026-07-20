import Link from "next/link";
import type { ReactNode } from "react";

import { CompanyBrand } from "@/components/shared/company-logo";
import type { AdminBooking } from "@/lib/admin/bookings/queries";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import type { BookingInvitation } from "@/lib/bookings/invitations/types";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import {
  formatCateringRequired,
  formatCateringServingTime,
} from "@/lib/bookings/catering/format";
import { getInvitationStatusLabel } from "@/lib/bookings/invitations/validation";
import { formatFacilityType } from "@/lib/facilities/format";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/bookings/print/print-button";
import { SignatureBlock } from "@/components/bookings/print/signature-block";

type PrintProfile = {
  fullName: string | null;
  email: string | null;
  department: string | null;
  phone: string | null;
};

type PrintableBooking = EmployeeBooking | AdminBooking;

function valueOrDash(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function PrintField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-zinc-950">
        {valueOrDash(value)}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="break-inside-avoid rounded-lg border border-zinc-300 p-5">
      <h2 className="text-base font-semibold tracking-normal text-zinc-950">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function BookingPrintForm({
  booking,
  requester,
  invitations,
  appName,
  companyName,
  backHref,
}: {
  booking: PrintableBooking;
  requester: PrintProfile;
  invitations: BookingInvitation[];
  appName: string;
  companyName: string;
  backHref: string;
}) {
  const acceptedCount = invitations.filter(
    (item) => item.status === "accepted",
  ).length;
  const pendingCount = invitations.filter(
    (item) => item.status === "pending",
  ).length;
  const declinedCount = invitations.filter(
    (item) => item.status === "declined",
  ).length;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 print:bg-white print:px-0 print:py-0">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          .print-hidden { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="print-hidden mx-auto mb-4 flex max-w-4xl flex-col gap-2 sm:flex-row sm:justify-end">
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          Back
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto grid max-w-4xl gap-5 bg-white p-6 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b border-zinc-300 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <CompanyBrand
              logoClassName="w-24 print:w-24"
              textClassName="text-4xl print:text-4xl"
              priority
            />
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-zinc-600">{appName}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">
                Booking Approval Form
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                {companyName} | Booking reference: {booking.id}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Generated {formatBookingDateTime(new Date().toISOString())}
              </p>
            </div>
          </div>
        </header>

        <Section title="Requester details">
          <dl className="grid gap-4 sm:grid-cols-2">
            <PrintField label="Requested by" value={requester.fullName} />
            <PrintField label="Email" value={requester.email} />
            <PrintField label="Department" value={requester.department} />
            <PrintField label="Phone" value={requester.phone} />
          </dl>
        </Section>

        <Section title="Booking details">
          <dl className="grid gap-4 sm:grid-cols-2">
            <PrintField label="Purpose / title" value={booking.title} />
            <PrintField
              label="Facility"
              value={booking.facility?.name ?? "Unavailable"}
            />
            <PrintField
              label="Level"
              value={booking.facility?.level ?? "Unavailable"}
            />
            <PrintField
              label="Facility type"
              value={
                booking.facility
                  ? formatFacilityType(booking.facility.type)
                  : "Unavailable"
              }
            />
            <PrintField label="Date" value={formatBookingDate(booking.startsAt)} />
            <PrintField
              label="Time"
              value={formatBookingWindow(booking.startsAt, booking.endsAt)}
            />
            <PrintField
              label="Attendee count"
              value={booking.attendeeCount ?? "Not provided"}
            />
            <div className="sm:col-span-2">
              <PrintField
                label="Description / agenda"
                value={booking.description || "No description provided."}
              />
            </div>
          </dl>
        </Section>

        <Section title="Involved departments">
          {booking.departments.length > 0 ? (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-300">
                  <th className="py-2 pr-3 font-semibold">Department</th>
                  <th className="py-2 pr-3 font-semibold">Notification mailbox</th>
                </tr>
              </thead>
              <tbody>
                {booking.departments.map((department) => (
                  <tr key={department.id} className="border-b border-zinc-200">
                    <td className="py-2 pr-3">{department.name}</td>
                    <td className="break-all py-2 pr-3">{department.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-zinc-600">No departments were tagged for this booking.</p>
          )}
        </Section>

        <Section title="Invited attendees">
          <p className="mb-4 text-sm text-zinc-600">
            Total invited: {invitations.length} | Accepted: {acceptedCount} |
            Pending: {pendingCount} | Declined: {declinedCount}
          </p>
          {invitations.length > 0 ? (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-300">
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b border-zinc-200">
                    <td className="py-2 pr-3">
                      {invitation.invitedUser?.fullName || "-"}
                    </td>
                    <td className="break-all py-2 pr-3">
                      {invitation.invitedUser?.email || "-"}
                    </td>
                    <td className="py-2 pr-3">
                      {getInvitationStatusLabel(invitation.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-zinc-600">No invited attendees.</p>
          )}
        </Section>

        <Section title="Food & drinks / catering">
          <dl className="grid gap-4 sm:grid-cols-2">
            <PrintField
              label="Required"
              value={formatCateringRequired(booking.catering.required)}
            />
            <PrintField label="Pax" value={booking.catering.pax} />
            <PrintField
              label="Serving time"
              value={formatCateringServingTime(booking.catering.servingTime)}
            />
            <PrintField
              label="Dietary / special notes"
              value={booking.catering.dietaryNotes}
            />
            {(() => {
              const notes = booking.catering.notes || "";
              const drinksMatch = notes.match(/Drinks:\s*([^\n]+)/);
              const foodMatch = notes.match(/Food:\s*([^\n]+)/);
              
              let remainingNotes = notes;
              if (drinksMatch) remainingNotes = remainingNotes.replace(drinksMatch[0], "");
              if (foodMatch) remainingNotes = remainingNotes.replace(foodMatch[0], "");
              remainingNotes = remainingNotes.trim();

              return (
                <>
                  {drinksMatch ? (
                    <PrintField label="Drinks" value={drinksMatch[1]} />
                  ) : null}
                  {foodMatch ? (
                    <PrintField label="Food" value={foodMatch[1]} />
                  ) : null}
                  <PrintField
                    label="Additional notes"
                    value={remainingNotes || "-"}
                  />
                </>
              );
            })()}
          </dl>
        </Section>

        <section className="grid gap-4">
          <h2 className="text-base font-semibold tracking-normal text-zinc-950">
            Approval / signature sections
          </h2>
          <SignatureBlock title="Requested by" />
          <SignatureBlock title="Superior / HOD / Boss approval" />
          <SignatureBlock title="Admin / Facilities approval" />
        </section>
      </article>
    </main>
  );
}
