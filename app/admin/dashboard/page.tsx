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
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Admin area"
        title="Admin dashboard"
        description={`Signed in as ${user.email}. Use the admin navigation to manage facilities, bookings, approvals, reports, and settings.`}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            title: "Bookings",
            description: "Review all facility reservations and cancellations.",
            href: "/admin/bookings",
            icon: CalendarCheck,
            accent:
              "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900",
            border: "border-l-indigo-500",
          },
          {
            title: "Pending approvals",
            description: "Process booking requests that need admin review.",
            href: "/admin/approvals",
            icon: ClipboardCheck,
            accent:
              "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
            border: "border-l-amber-500",
          },
          {
            title: "Availability controls",
            description: "Manage blocked periods and maintenance closures.",
            href: "/admin/maintenance",
            icon: Wrench,
            accent:
              "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900",
            border: "border-l-sky-500",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg border border-l-4 border-border/70 ${item.border} bg-card p-4 text-card-foreground shadow-sm shadow-primary/5 ring-1 ring-primary/10 transition-all hover:border-primary/35 hover:bg-accent/60 hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35`}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-lg ring-1 ${item.accent}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 font-semibold tracking-normal">
                {item.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-5 text-card-foreground shadow-sm shadow-primary/5 ring-1 ring-primary/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold tracking-normal">
              Operational shortcuts
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use these sections for monitoring, exports, notifications, and
              system configuration.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/admin/email-notifications"
            className={buttonVariants({ variant: "outline" })}
          >
            <Mail data-icon="inline-start" />
            Email queue
          </Link>
          <Link
            href="/admin/reports"
            className={buttonVariants({ variant: "outline" })}
          >
            <BarChart3 data-icon="inline-start" />
            Reports
          </Link>
          <Link
            href="/admin/settings"
            className={buttonVariants({ variant: "outline" })}
          >
            <Settings data-icon="inline-start" />
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}
