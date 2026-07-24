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
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { user, profile } = await requireAdmin();
  const isSuperAdmin = isSuperAdminRole(profile.role);
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Admin operations"
        title="Room booking control"
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            title: "All bookings",
            description: "Search room reservations, cancellations, and usage status.",
            href: "/admin/bookings",
            icon: CalendarCheck,
          },
          {
            title: "Pending approvals",
            description: "Approve or reject requests before the room is confirmed.",
            href: "/admin/approvals",
            icon: ClipboardCheck,
          },
          {
            title: "Room availability",
            description: "Manage all closures and unavailable time in one place.",
            href: "/admin/unavailability",
            icon: Wrench,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="grid gap-2 rounded-lg border border-border/80 bg-card p-4 text-card-foreground shadow-sm shadow-foreground/10 ring-1 ring-border/60 transition-colors hover:border-primary/45 hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 dark:shadow-black/25"
            >
              <div className="flex size-8 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="font-semibold tracking-normal">{item.title}</h2>
              <p className="text-sm leading-5 text-muted-foreground">
                {item.description}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/70 bg-card p-4 text-card-foreground sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold tracking-normal">
              Follow-up tools
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Check email delivery, export booking records, and adjust system settings when operations need attention.
            </p>
          </div>
        </div>
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
