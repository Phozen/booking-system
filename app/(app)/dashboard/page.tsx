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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
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
        {[
          {
            href: "/facilities",
            title: "Browse facilities",
            description:
              "Compare rooms, capacity, equipment, and approval requirements.",
            icon: Building2,
            accent:
              "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900",
          },
          {
            href: "/bookings/new",
            title: "Create booking",
            description: "Pick a facility, date, time, and purpose in one short form.",
            icon: CalendarPlus,
            accent:
              "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900",
          },
          {
            href: "/calendar",
            title: "Calendar",
            description: "Scan past, current, and upcoming bookings by month.",
            icon: CalendarDays,
            accent:
              "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-900",
          },
          {
            href: "/my-bookings",
            title: "My Bookings",
            description: "Review pending, upcoming, historical, and cancelled bookings.",
            icon: ClipboardList,
            accent:
              "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-sm ring-1 ring-primary/5 transition-all hover:border-primary/30 hover:bg-accent/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-lg ring-1 ${item.accent}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 font-medium tracking-normal">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-5 text-card-foreground shadow-sm ring-1 ring-primary/5">
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
                className="grid gap-2 rounded-lg border border-border/70 bg-background p-3 shadow-sm ring-1 ring-primary/5 transition-all hover:border-primary/30 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
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
