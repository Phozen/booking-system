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
import { employeeFeatureStyles } from "@/components/shared/employee-feature-styles";
import { PageHeader } from "@/components/shared/page-header";
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
      />

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {employeeNavigation.map((item) => {
          const Icon = item.icon;
          const tone = employeeFeatureStyles[item.tone];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group grid min-h-32 place-items-center gap-3 rounded-lg border p-4 text-center shadow-lg transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:min-h-44 sm:gap-4 sm:p-6 ${tone.home}`}
            >
              <div className={`flex size-14 items-center justify-center rounded-xl ring-1 sm:size-16 ${tone.icon}`}>
                <Icon className="size-7 sm:size-9" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold tracking-normal sm:text-2xl">{item.title}</h2>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium">Next room bookings</h2>
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
