import Link from "next/link";
import { CalendarDays, CalendarPlus, ClipboardList, UserPlus } from "lucide-react";

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
        title="Quick actions"
        description={`Choose the next booking task for ${user.email}.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/bookings/new",
            title: "New booking",
            description: "Choose room, date, time, and catering.",
            icon: CalendarPlus,
          },
          {
            href: "/calendar",
            title: "Calendar",
            description: "Pick a day and book from the schedule.",
            icon: CalendarDays,
          },
          {
            href: "/my-bookings",
            title: "My bookings",
            description: "Open, edit, print, or cancel requests.",
            icon: ClipboardList,
          },
          {
            href: "/invitations",
            title: "Invitations",
            description: "Review meetings you were invited to.",
            icon: UserPlus,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="grid min-h-36 gap-3 rounded-lg border border-border/80 bg-card p-4 text-card-foreground shadow-sm shadow-foreground/10 ring-1 ring-border/60 transition-colors hover:border-primary/45 hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 dark:shadow-black/25"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-border/70 bg-background text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold tracking-normal">{item.title}</h2>
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
          <div className="mt-4 grid gap-2">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="grid gap-2 rounded-md border border-border/75 bg-background px-3 py-3 shadow-xs shadow-foreground/5 transition-colors first:mt-0 hover:border-primary/35 hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 dark:shadow-black/20 sm:grid-cols-[1fr_auto] sm:items-center"
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
                href="/bookings/new"
                className={buttonVariants({ variant: "outline" })}
              >
                New booking
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
