import Link from "next/link";
import { Bell } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        description="Review booking alerts and updates that need your attention."
      />

      <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
        <EmptyState
          icon={<Bell className="size-5" aria-hidden="true" />}
          title="No notifications yet"
          description="Booking updates, invitation activity, and reminders that need your attention will appear here."
          action={
            <Link
              href="/profile"
              className={buttonVariants({ variant: "outline" })}
            >
              Manage notification settings
            </Link>
          }
        />
      </section>
    </main>
  );
}
