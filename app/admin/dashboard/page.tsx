import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Mail,
  Settings,
  Wrench,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { isSuperAdminRole } from "@/lib/auth/profile";
import { getAdminDashboardData } from "@/lib/admin/dashboard/queries";
import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingWindow,
} from "@/lib/bookings/format";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminDashboardGuide } from "@/components/admin/admin-dashboard-guide";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { profile } = await requireAdmin();
  const isSuperAdmin = isSuperAdminRole(profile.role);
  const supabase = await createClient();
  const dashboard = await getAdminDashboardData(supabase);

  const shortcuts = [
    {
      href: "/admin/email-notifications",
      label: "Email queue",
      icon: Mail,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: BarChart3,
    },
    ...(isSuperAdmin
      ? [
          {
            href: "/admin/settings",
            label: "Settings",
            icon: Settings,
          },
        ]
      : []),
  ];

  const metrics = [
    {
      label: "Pending approvals",
      value: dashboard.metrics.pendingApprovalsCount,
      href: "/admin/approvals",
      icon: ClipboardCheck,
    },
    {
      label: "Upcoming bookings",
      value: dashboard.metrics.upcomingBookingsCount,
      href: "/admin/bookings?status=confirmed",
      icon: CalendarCheck,
    },
    {
      label: "Active unavailability",
      value: dashboard.metrics.activeUnavailabilityCount,
      href: "/admin/unavailability",
      icon: Wrench,
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Admin operations"
        title="Room booking control"
        description="Review pending requests and upcoming activity at a glance."
        primaryAction={
          <Link
            href="/admin/approvals"
            className={buttonVariants({ className: "w-full sm:w-auto" })}
          >
            <ClipboardCheck data-icon="inline-start" />
            Review approvals
          </Link>
        }
        secondaryAction={
          <Link
            href="/admin/bookings"
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto",
            })}
          >
            <CalendarCheck data-icon="inline-start" />
            All bookings
          </Link>
        }
      />

      <section
        aria-labelledby="admin-dashboard-metrics"
        className="qbook-stagger grid gap-3 sm:grid-cols-3"
      >
        <h2 id="admin-dashboard-metrics" className="sr-only">
          Summary metrics
        </h2>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.href}
              href={metric.href}
              className="grid gap-2 rounded-lg border border-border/80 bg-card p-4 text-card-foreground shadow-sm shadow-foreground/10 ring-1 ring-border/60 transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/55 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 dark:shadow-black/25"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-normal tabular-nums">
                {metric.value}
              </p>
            </Link>
          );
        })}
      </section>

      <AdminDashboardGuide />

      <section
        aria-labelledby="admin-dashboard-pending"
        className="grid gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-2">
          <h2
            id="admin-dashboard-pending"
            className="text-base font-semibold tracking-normal"
          >
            Pending approvals
          </h2>
          <Link
            href="/admin/approvals"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View all
          </Link>
        </div>
        {dashboard.pendingApprovals.length > 0 ? (
          <ul className="grid gap-2">
            {dashboard.pendingApprovals.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{booking.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {booking.facility
                        ? `${booking.facility.name}, ${booking.facility.level}`
                        : "Room unavailable"}
                      {" · "}
                      {booking.user?.fullName ||
                        booking.user?.email ||
                        "Unknown requester"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {formatBookingDate(booking.startsAt)}{" "}
                    {formatBookingWindow(booking.startsAt, booking.endsAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No pending approvals" />
        )}
      </section>

      <section
        aria-labelledby="admin-dashboard-upcoming"
        className="grid gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-2">
          <h2
            id="admin-dashboard-upcoming"
            className="text-base font-semibold tracking-normal"
          >
            Upcoming bookings
          </h2>
          <Link
            href="/admin/bookings?status=confirmed"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View all
          </Link>
        </div>
        {dashboard.upcomingBookings.length > 0 ? (
          <ul className="grid gap-2">
            {dashboard.upcomingBookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{booking.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {booking.facility
                        ? `${booking.facility.name}, ${booking.facility.level}`
                        : "Room unavailable"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {formatBookingDate(booking.startsAt)}{" "}
                    {formatBookingWindow(booking.startsAt, booking.endsAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No upcoming bookings" />
        )}
      </section>

      <section
        aria-labelledby="admin-dashboard-unavailability"
        className="grid gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-2">
          <h2
            id="admin-dashboard-unavailability"
            className="text-base font-semibold tracking-normal"
          >
            Active unavailability
          </h2>
          <Link
            href="/admin/unavailability"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Manage
          </Link>
        </div>
        {dashboard.activeUnavailability.length > 0 ? (
          <ul className="grid gap-2">
            {dashboard.activeUnavailability.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                      {item.kind === "blocked" ? "Blocked period" : "Maintenance"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {formatBookingDateTime(item.startsAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No active unavailability" />
        )}
      </section>

      <section
        aria-labelledby="admin-dashboard-audit"
        className="grid gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-2">
          <h2
            id="admin-dashboard-audit"
            className="text-base font-semibold tracking-normal"
          >
            Recent audit activity
          </h2>
          <Link
            href="/admin/audit-logs"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View logs
          </Link>
        </div>
        {dashboard.recentAudit.length > 0 ? (
          <ul className="grid gap-2">
            {dashboard.recentAudit.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/audit-logs/${item.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.summary || "Audit event"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.actorEmail || "System"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {formatBookingDateTime(item.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No recent audit activity" />
        )}
      </section>

      <section
        aria-labelledby="admin-dashboard-shortcuts"
        className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground sm:p-5"
      >
        <h2
          id="admin-dashboard-shortcuts"
          className="font-semibold tracking-normal"
        >
          Follow-up tools
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Check email delivery, export booking records, and adjust system
          settings when operations need attention.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className={buttonVariants({ variant: "outline" })}
              >
                <Icon data-icon="inline-start" />
                {shortcut.label}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
