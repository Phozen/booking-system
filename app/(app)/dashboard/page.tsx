import Link from "next/link";
import { CalendarPlus, ChevronRight } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  formatBookingDate,
  formatBookingWindow,
} from "@/lib/bookings/format";
import { getMyUpcomingBookings } from "@/lib/bookings/queries";
import { createClient } from "@/lib/supabase/server";
import { employeeCopy } from "@/lib/employee/plain-language";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { employeeFeatureStyles } from "@/components/shared/employee-feature-styles";
import { HomeOnboarding } from "@/components/shared/home-onboarding";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { employeeDashboardActions } from "@/config/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const upcomingBookings = await getMyUpcomingBookings(supabase, user.id, 3);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi, ${firstName}` : "Welcome";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Room booking"
        title={greeting}
        description="Book a meeting room in a few clear steps."
      />

      <section
        aria-label="Quick actions"
        className="qbook-stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {employeeDashboardActions.map((item) => {
          const Icon = item.icon;
          const tone = employeeFeatureStyles[item.tone];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group grid min-h-32 place-items-center gap-3 rounded-xl border p-4 text-center shadow-lg transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:min-h-44 sm:gap-4 sm:p-6 ${tone.home}`}
            >
              <div
                className={`flex size-14 items-center justify-center rounded-xl ring-1 transition-transform duration-200 ease-out group-hover:scale-105 sm:size-16 ${tone.icon}`}
              >
                <Icon className="size-7 sm:size-9" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold tracking-normal sm:text-2xl">
                {item.title}
              </h2>
            </Link>
          );
        })}
      </section>

      <HomeOnboarding />

      <section className="rounded-xl border border-border/70 bg-card p-4 text-card-foreground sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              {employeeCopy.comingUp}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your next room bookings.
            </p>
          </div>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="qbook-stagger mt-4 grid gap-2">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="group grid min-h-14 gap-2 rounded-lg border border-border/75 bg-background px-4 py-3 shadow-xs shadow-foreground/5 transition-[background-color,border-color,box-shadow] duration-150 hover:border-primary/35 hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 dark:shadow-black/20 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium">
                    {booking.title}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.facility
                      ? `${booking.facility.name}, ${booking.facility.level}`
                      : employeeCopy.roomUnavailable}{" "}
                    · {formatBookingDate(booking.startsAt)} ·{" "}
                    {formatBookingWindow(booking.startsAt, booking.endsAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BookingStatusBadge status={booking.status} />
                  <span className="inline-flex items-center gap-0.5 text-sm font-medium text-primary transition-transform duration-150 group-hover:translate-x-0.5">
                    {employeeCopy.open}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-5"
            title="No upcoming bookings yet"
            description="When you need a meeting room, start here."
            action={
              <Link
                href="/bookings/new"
                className={buttonVariants({ size: "lg" })}
              >
                <CalendarPlus data-icon="inline-start" />
                {employeeCopy.bookARoom}
              </Link>
            }
          />
        )}

        {!profile ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Your profile could not be loaded, so some booking actions may be
            limited.
          </p>
        ) : null}
      </section>
    </main>
  );
}
