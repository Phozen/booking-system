"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { AppNotification } from "@/lib/notifications/app-notifications";

const STORAGE_PREFIX = "qbook:toasted-notification:";

/**
 * Shows a one-shot Sonner toast for each unread booking approval
 * the first time the user loads the app after it was created.
 */
export function UnseenApprovalToasts({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || typeof window === "undefined") {
      return;
    }

    shown.current = true;

    const approvals = notifications.filter(
      (notification) =>
        notification.type === "booking_approval" && !notification.seenAt,
    );

    for (const notification of approvals.slice(0, 3)) {
      const key = `${STORAGE_PREFIX}${notification.id}`;
      try {
        if (window.sessionStorage.getItem(key)) {
          continue;
        }
        window.sessionStorage.setItem(key, "1");
      } catch {
        // sessionStorage may be blocked; still show once this mount.
      }

      toast.success(notification.title, {
        description: notification.body ?? undefined,
        duration: 6000,
      });
    }
  }, [notifications]);

  return null;
}
