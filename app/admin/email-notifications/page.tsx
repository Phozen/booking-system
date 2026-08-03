import { requireAdmin } from "@/lib/auth/guards";
import { getAdminEmailNotifications } from "@/lib/admin/email-notifications/queries";
import type {
  EmailNotificationStatus,
  EmailNotificationType,
} from "@/lib/email/types";
import { createClient } from "@/lib/supabase/server";
import { EmailNotificationsTable } from "@/components/admin/email-notifications/email-notifications-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statusOptions: EmailNotificationStatus[] = [
  "queued",
  "sending",
  "sent",
  "failed",
  "cancelled",
];
const typeOptions: EmailNotificationType[] = [
  "booking_confirmation",
  "booking_approval",
  "booking_rejection",
  "booking_cancellation",
  "booking_catering_request",
  "booking_reminder",
  "booking_invitation",
  "booking_invitation_accepted",
  "booking_invitation_declined",
];

function parseDate(value: string | undefined) {
  return value && datePattern.test(value) ? value : undefined;
}

export default async function AdminEmailNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    recipient?: string;
  }>;
}) {
  await requireAdmin();
  const { status, type, dateFrom, dateTo, recipient } = await searchParams;
  const selectedStatus =
    status && status !== "all" && statusOptions.includes(status as EmailNotificationStatus)
      ? (status as EmailNotificationStatus)
      : undefined;
  const selectedType =
    type && type !== "all" && typeOptions.includes(type as EmailNotificationType)
      ? (type as EmailNotificationType)
      : undefined;
  const selectedDateFrom = parseDate(dateFrom);
  const selectedDateTo = parseDate(dateTo);
  const selectedRecipient = recipient?.trim() || undefined;

  const supabase = await createClient();
  const notifications = await getAdminEmailNotifications(supabase, {
    status: selectedStatus,
    type: selectedType,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo,
    recipient: selectedRecipient,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader eyebrow="Admin area" title="Email notifications" />

      <EmailNotificationsTable
        notifications={notifications}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
        selectedDateFrom={selectedDateFrom}
        selectedDateTo={selectedDateTo}
        selectedRecipient={selectedRecipient}
      />
    </main>
  );
}
