import Link from "next/link";
import type { ReactNode } from "react";

import { CompanyBrand } from "@/components/shared/company-logo";
import type { AdminBooking } from "@/lib/admin/bookings/queries";
import type { EmployeeBooking } from "@/lib/bookings/queries";
import type { BookingInvitation } from "@/lib/bookings/invitations/types";
import { INTERNAL_INVITES_ENABLED } from "@/lib/bookings/invitations/feature";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import {
  formatCateringRequired,
  formatCateringServingTime,
} from "@/lib/bookings/catering/format";
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
      <dt className="qbook-type-meta font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground print:text-zinc-950">
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
    <section className="break-inside-avoid rounded-lg border border-border p-5 print:border-zinc-300">
      <h2 className="qbook-type-section text-foreground print:text-zinc-950">
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
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground print:bg-white print:px-0 print:py-0 print:text-zinc-950">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          .print-hidden { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="print-hidden mx-auto mb-6 flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="qbook-type-meta">Booking approval form</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={backHref} className={buttonVariants({ variant: "ghost" })}>
            Back to booking
          </Link>
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto grid max-w-3xl gap-5 rounded-lg border border-border bg-card p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="border-b border-border pb-5 print:border-zinc-300">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <CompanyBrand
              logoClassName="w-20 print:w-24"
              textClassName="text-3xl print:text-4xl"
              priority
            />
            <div className="text-left sm:text-right">
              <h1 className="qbook-type-title text-xl sm:text-2xl">
                Booking Approval Form
              </h1>
              <p className="qbook-type-meta mt-2">
                {companyName}
              </p>
              <p className="qbook-type-meta mt-1 qbook-type-tabular">
                Ref: {booking.id}
              </p>
              <p className="qbook-type-meta mt-1">
                Generated {formatBookingDateTime(new Date().toISOString())}
              </p>
              <p className="sr-only">{appName}</p>
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
                <tr className="border-b border-border print:border-zinc-300">
                  <th className="py-2 pr-3 font-semibold">Department</th>
                  <th className="py-2 pr-3 font-semibold">Notification mailbox</th>
                </tr>
              </thead>
              <tbody>
                {booking.departments.map((department) => (
                  <tr key={department.id} className="border-b border-border/70 print:border-zinc-200">
                    <td className="py-2 pr-3">{department.name}</td>
                    <td className="break-all py-2 pr-3">{department.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="qbook-type-meta">No departments were tagged for this booking.</p>
          )}
        </Section>

        {INTERNAL_INVITES_ENABLED ? (
          <Section title="Invited attendees">
            <p className="qbook-type-meta mb-4 qbook-type-tabular">
              Total attendees: {invitations.length}
            </p>
            {invitations.length > 0 ? (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border print:border-zinc-300">
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="border-b border-border/70 print:border-zinc-200">
                      <td className="py-2 pr-3">
                        {invitation.invitedUser?.fullName || "-"}
                      </td>
                      <td className="break-all py-2 pr-3">
                        {invitation.invitedUser?.email || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="qbook-type-meta">No invited attendees.</p>
            )}
          </Section>
        ) : null}

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
          <h2 className="qbook-type-section">Approval / signature sections</h2>
          <SignatureBlock title="Requested by" />
          <SignatureBlock title="Superior / HOD / Boss approval" />
          <SignatureBlock title="Admin / Facilities approval" />
        </section>
      </article>
    </main>
  );
}
