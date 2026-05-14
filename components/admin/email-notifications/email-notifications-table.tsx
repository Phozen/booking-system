"use client";

import Link from "next/link";
import { useState } from "react";

import {
  processQueuedEmailNotificationsAction,
  retryFailedEmailNotificationsAction,
  type EmailNotificationsActionResult,
} from "@/lib/admin/email-notifications/actions";
import type { AdminEmailNotification } from "@/lib/admin/email-notifications/queries";
import type { EmailNotificationType } from "@/lib/email/types";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";

function formatNotificationType(type: EmailNotificationType) {
  const labels: Record<EmailNotificationType, string> = {
    booking_confirmation: "Booking Confirmation",
    booking_approval: "Booking Approval",
    booking_rejection: "Booking Rejection",
    booking_cancellation: "Booking Cancellation",
    booking_reminder: "Booking Reminder",
    booking_invitation: "Booking Invitation",
    booking_invitation_accepted: "Invitation Accepted",
    booking_invitation_declined: "Invitation Declined",
  };

  return labels[type];
}

function formatProvider(provider: string | null) {
  if (!provider) {
    return "None";
  }

  const normalized = provider.toLowerCase();

  if (normalized === "smtp") {
    return "SMTP";
  }

  if (normalized === "resend") {
    return "Resend";
  }

  if (normalized === "noop") {
    return "Not configured";
  }

  return provider;
}

export function EmailNotificationsTable({
  notifications,
}: {
  notifications: AdminEmailNotification[];
}) {
  const [result, setResult] = useState<EmailNotificationsActionResult | null>(
    null,
  );
  const [isPending, setIsPending] = useState(false);

  async function runAction(action: "process" | "retry") {
    setIsPending(true);

    try {
      const actionResult =
        action === "process"
          ? await processQueuedEmailNotificationsAction()
          : await retryFailedEmailNotificationsAction();

      setResult(actionResult);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold tracking-normal">Email queue</h2>
          <p className="text-sm text-muted-foreground">
            Showing the latest {notifications.length} notification records
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ConfirmDialog
            triggerLabel="Retry failed"
            title="Retry failed email notifications?"
            description="Failed notifications will be queued for another send attempt. Emails may be sent if provider settings are configured correctly."
            confirmLabel="Retry failed"
            cancelLabel="Leave failed"
            pendingLabel="Retrying..."
            pending={isPending}
            triggerClassName="w-full sm:w-auto"
            onConfirm={() => runAction("retry")}
          />
          <ConfirmDialog
            triggerLabel="Process queued emails"
            title="Process queued email notifications?"
            description="Queued notifications scheduled for now or earlier will be sent if provider settings are configured. Missing provider settings will be recorded as a safe failure."
            confirmLabel="Process queued emails"
            cancelLabel="Leave queued"
            pendingLabel="Processing..."
            pending={isPending}
            triggerClassName="w-full sm:w-auto"
            onConfirm={() => runAction("process")}
          />
        </div>
      </div>

      {result ? (
        <Alert variant={result.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      <AdminTableShell
        title="Notification records"
        description="Latest queued, sent, and failed email notifications"
        mobileCards={
          notifications.length > 0 ? (
            notifications.map((notification) => (
              <MobileRecordCard
                key={notification.id}
                eyebrow={formatNotificationType(notification.type)}
                title={notification.subject}
                badges={
                  <StatusBadge kind="email" status={notification.status} />
                }
                rows={[
                  { label: "Recipient", value: notification.recipientEmail },
                  {
                    label: "Attempts",
                    value: `${notification.attempts}/${notification.maxAttempts}`,
                  },
                  {
                    label: "Provider",
                    value: formatProvider(notification.provider),
                  },
                  {
                    label: "Scheduled",
                    value: formatBookingDateTime(notification.scheduledFor),
                  },
                  {
                    label: "Sent",
                    value: notification.sentAt
                      ? formatBookingDateTime(notification.sentAt)
                      : "Not sent",
                  },
                  {
                    label: "Related booking",
                    value: notification.booking ? (
                      <Link
                        href={`/admin/bookings/${notification.booking.id}`}
                        className={buttonVariants({
                          variant: "link",
                          size: "sm",
                          className: "h-auto p-0",
                        })}
                      >
                        {notification.booking.title}
                      </Link>
                    ) : (
                      "None"
                    ),
                  },
                  {
                    label: "Last error",
                    value: notification.lastError || "None",
                  },
                ]}
              />
            ))
          ) : (
            <EmptyState
              className="bg-transparent"
              title="No email notifications found"
              description="Booking actions will create queued notification records when email events are needed."
            />
          )
        }
      >
          <table className="w-full min-w-[1400px] border-collapse text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Related booking</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Last error</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <tr key={notification.id} className="border-t">
                    <td className="px-4 py-3">
                      {formatNotificationType(notification.type)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="email" status={notification.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {notification.recipientEmail}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3 font-medium">
                      {notification.subject}
                    </td>
                    <td className="px-4 py-3">
                      {notification.booking ? (
                        <Link
                          href={`/admin/bookings/${notification.booking.id}`}
                          className={buttonVariants({
                            variant: "link",
                            size: "sm",
                          })}
                        >
                          {notification.booking.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {notification.attempts}/{notification.maxAttempts}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatProvider(notification.provider)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBookingDateTime(notification.scheduledFor)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {notification.sentAt
                        ? formatBookingDateTime(notification.sentAt)
                        : "Not sent"}
                    </td>
                    <td className="max-w-[300px] truncate px-4 py-3 text-muted-foreground">
                      {notification.lastError || "None"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBookingDateTime(notification.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8"
                    colSpan={11}
                  >
                    <EmptyState
                      className="border-0 bg-transparent py-4"
                      title="No email notifications found"
                      description="Booking actions will create queued notification records when email events are needed."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </AdminTableShell>
    </div>
  );
}
