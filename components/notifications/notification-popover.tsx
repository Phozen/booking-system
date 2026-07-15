"use client";

import { useState, useTransition } from "react";
import { Popover } from "@base-ui/react/popover";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import type { AppNotification } from "@/lib/notifications/app-notifications";
import {
  markAllNotificationsSeenAction,
  markNotificationSeenAction,
} from "@/lib/notifications/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

function getNotificationHref(notification: AppNotification) {
  return (
    notification.href ??
    (notification.relatedBookingId
      ? `/bookings/${notification.relatedBookingId}`
      : null)
  );
}

export function NotificationPopover({
  notifications,
  unseenCount,
  onNavigate,
}: {
  notifications: AppNotification[];
  unseenCount: number;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasUnseen = unseenCount > 0;

  function openNotification(notification: AppNotification) {
    const href = getNotificationHref(notification);
    if (!href) return;

    setOpen(false);
    onNavigate?.();
    startTransition(async () => {
      if (!notification.seenAt) {
        await markNotificationSeenAction(notification.id);
      }
      router.push(href);
    });
  }

  function markAllAsRead() {
    startTransition(async () => {
      await markAllNotificationsSeenAction();
      router.refresh();
    });
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative",
        )}
        aria-label={
          hasUnseen
            ? `Notifications, ${unseenCount} unseen`
            : "Notifications"
        }
      >
        <Bell aria-hidden="true" />
        {hasUnseen ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[0.65rem] font-bold leading-none text-destructive-foreground shadow-sm">
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        ) : null}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={10}
          className="z-[90] outline-none"
        >
          <Popover.Popup className="w-[min(24rem,calc(100vw-1rem))] origin-[var(--transform-origin)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Popover.Arrow className="size-3 rotate-45 border-l border-t border-border bg-popover" />

            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <Popover.Title className="text-base font-bold">
                Notifications
              </Popover.Title>
              {notifications.length > 0 ? (
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={markAllAsRead}
                  disabled={!hasUnseen || isPending}
                >
                  <CheckCheck className="size-4" aria-hidden="true" />
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="max-h-[min(28rem,calc(100svh-10rem))] overflow-y-auto overscroll-contain p-2">
              {notifications.length > 0 ? (
                <div className="grid gap-1">
                  {notifications.map((notification) => {
                    const href = getNotificationHref(notification);
                    const content = (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary">
                            {typeLabels[notification.type]}
                          </span>
                          <time
                            className="ml-auto shrink-0 text-[0.7rem] text-muted-foreground"
                            dateTime={notification.createdAt}
                          >
                            {formatNotificationTime(notification.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1 text-sm font-semibold leading-5">
                          {notification.title}
                        </p>
                        {notification.body ? (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
                            {notification.body}
                          </p>
                        ) : null}
                      </>
                    );

                    return href ? (
                      <button
                        key={notification.id}
                        type="button"
                        className={cn(
                          "relative w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-accent/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          !notification.seenAt && "bg-primary/8",
                        )}
                        onClick={() => openNotification(notification)}
                        disabled={isPending}
                      >
                        {!notification.seenAt ? (
                          <span
                            className="absolute left-1 top-4 size-1.5 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        ) : null}
                        {content}
                      </button>
                    ) : (
                      <div
                        key={notification.id}
                        className={cn(
                          "relative rounded-md px-3 py-2.5",
                          !notification.seenAt && "bg-primary/8",
                        )}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid min-h-32 place-items-center px-6 py-8 text-center">
                  <div>
                    <Bell
                      className="mx-auto mb-2 size-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold">No notifications yet</p>
                  </div>
                </div>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
