import Link from "next/link";
import { Bell } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  getUserAppNotifications,
  type AppNotification,
} from "@/lib/notifications/app-notifications";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAllNotificationsSeenAction } from "@/lib/notifications/actions";

export const dynamic = "force-dynamic";

const typeLabels: Record<AppNotification["type"], string> = {
  booking_confirmation: "Booking confirmed",
  booking_approval: "Booking approved",
  booking_rejection: "Booking rejected",
  booking_cancellation: "Booking cancelled",
  booking_invitation: "Invitation",
  booking_invitation_accepted: "Invitation accepted",
  booking_invitation_declined: "Invitation declined",
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const content = (
    <article
      className={cn(
        "grid gap-2 rounded-lg border border-border/70 bg-card p-4 shadow-sm transition-colors",
        !notification.seenAt &&
          "border-primary/35 bg-primary/5 shadow-primary/10 ring-1 ring-primary/15",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {typeLabels[notification.type]}
        </span>
        {!notification.seenAt ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            New
          </span>
        ) : null}
        <time
          className="text-xs text-muted-foreground"
          dateTime={notification.createdAt}
        >
          {formatNotificationTime(notification.createdAt)}
        </time>
      </div>
      <h2 className="text-base font-semibold tracking-normal">
        {notification.title}
      </h2>
      {notification.body ? (
        <p className="text-sm text-muted-foreground">{notification.body}</p>
      ) : null}
    </article>
  );

  if (!notification.href) {
    return content;
  }

  return (
    <Link
      href={notification.href}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}

export default async function NotificationsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const notifications = await getUserAppNotifications(supabase, user.id);
  const hasUnseen = notifications.some((n) => !n.seenAt);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        primaryAction={
          notifications.length > 0 ? (
            <form action={markAllNotificationsSeenAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!hasUnseen}
              >
                Mark all as read
              </Button>
            </form>
          ) : null
        }
      />

      <section className="grid gap-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        ) : (
          <EmptyState
            icon={<Bell className="size-5" aria-hidden="true" />}
            title="No notifications yet"
          />
        )}
      </section>
    </main>
  );
}
