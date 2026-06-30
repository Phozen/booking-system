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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Room booking"
        title="Your booking workspace"
        description={`Find a room, check pending requests, and keep track of confirmed time slots for ${user.email}.`}
        primaryAction={
          <Link href="/bookings/new" className={buttonVariants()}>
            <CalendarPlus data-icon="inline-start" />
            Book a room
          </Link>
        }
        secondaryAction={
          <Link
            href="/my-bookings"
            className={buttonVariants({ variant: "outline" })}
          >
            View all bookings
          </Link>
        }
      />

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/facilities",
            title: "Find a room",
            description: "Capacity, equipment, and approval rules.",
            icon: Building2,
          },
          {
            href: "/bookings/new",
            title: "Book a time slot",
            description: "Choose room, date, attendees, and purpose.",
            icon: CalendarPlus,
          },
          {
            href: "/calendar",
            title: "Check the calendar",
            description: "See room usage across the month.",
            icon: CalendarDays,
          },
          {
            href: "/my-bookings",
            title: "Manage requests",
            description: "Pending, confirmed, history, and cancelled.",
            icon: ClipboardList,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="grid gap-2 rounded-lg border border-border/70 bg-card p-3 text-card-foreground transition-colors hover:border-primary/35 hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
            >
              <div className="flex size-8 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-medium tracking-normal">{item.title}</h2>
              <p className="text-sm leading-5 text-muted-foreground">{item.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium">Next room bookings</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Confirmed bookings are ready to use. Pending requests still need approval.
            </p>
          </div>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="mt-4 divide-y divide-border/70">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="grid gap-2 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium">{booking.title}</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.facility
                      ? `${booking.facility.name}, ${booking.facility.level}`
                      : "Room unavailable"}{" "}
                    - {formatBookingDate(booking.startsAt)} -{" "}
                    {formatBookingWindow(booking.startsAt, booking.endsAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BookingStatusBadge status={booking.status} />
                  <span className="text-sm text-muted-foreground">Open</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            title="No upcoming bookings yet"
            description="Start with the room list when capacity or equipment matters, or book directly if you already know the room and time."
            action={
              <Link
                href="/facilities"
                className={buttonVariants({ variant: "outline" })}
              >
                Find a room
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
