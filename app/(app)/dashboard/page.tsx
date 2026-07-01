import Link from "next/link";

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
import { employeeFeatureStyles } from "@/components/shared/employee-feature-styles";
import { buttonVariants } from "@/components/ui/button";
import { employeeNavigation } from "@/config/navigation";

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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {employeeNavigation.map((item) => {
          const Icon = item.icon;
          const tone = employeeFeatureStyles[item.tone];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-48 place-items-center gap-5 rounded-lg border p-6 text-center shadow-lg ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45 ${tone.home}`}
            >
              <div className={`flex size-20 items-center justify-center rounded-xl ring-1 ${tone.icon}`}>
                <Icon className="size-12" aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-bold tracking-normal">{item.title}</h2>
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
