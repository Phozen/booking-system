import Link from "next/link";
import { Building2, CalendarDays, CalendarPlus, ClipboardList } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import { getMyUpcomingBookings } from "@/lib/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const upcomingBookings = await getMyUpcomingBookings(supabase, user.id, 3);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Employee area"
        title="Dashboard"
        description={`Signed in as ${user.email}. Review your upcoming bookings or start a new request.`}
        primaryAction={
          <Link href="/bookings/new" className={buttonVariants()}>
            <CalendarPlus data-icon="inline-start" />
            New booking
          </Link>
        }
        secondaryAction={
          <Link
            href="/my-bookings"
            className={buttonVariants({ variant: "outline" })}
          >
            My Bookings
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <Link
          href="/facilities"
          className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-3 font-medium tracking-normal">Browse facilities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare rooms, capacity, equipment, and approval requirements.
          </p>
        </Link>
        <Link
          href="/bookings/new"
          className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarPlus className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-3 font-medium tracking-normal">Create booking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a facility, date, time, and purpose in one short form.
          </p>
        </Link>
        <Link
          href="/calendar"
          className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-3 font-medium tracking-normal">Calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan past, current, and upcoming bookings by month.
          </p>
        </Link>
        <Link
          href="/my-bookings"
          className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-3 font-medium tracking-normal">My Bookings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review pending, upcoming, historical, and cancelled bookings.
          </p>
        </Link>
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium">Upcoming bookings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your next confirmed or pending bookings.
            </p>
          </div>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="grid gap-2 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{booking.title}</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {booking.facility
                    ? `${booking.facility.name}, ${booking.facility.level}`
                    : "Facility unavailable"}{" "}
                  - {formatBookingDate(booking.startsAt)} -{" "}
                  {formatBookingWindow(booking.startsAt, booking.endsAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            title="No upcoming bookings yet"
            description="Browse facilities or create a booking when you need a room."
            action={
              <Link
                href="/facilities"
                className={buttonVariants({ variant: "outline" })}
              >
                Browse facilities
              </Link>
            }
          />
        )}

        {!profile ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Profile details are unavailable, so booking actions may be limited.
          </p>
        ) : null}
      </section>
    </main>
  );
}
