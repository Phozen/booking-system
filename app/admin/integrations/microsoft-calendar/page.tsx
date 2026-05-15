import Link from "next/link";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { formatBookingDateTime } from "@/lib/bookings/format";
import {
  getMicrosoftCalendarIntegrationStatus,
  getMicrosoftCalendarSyncRecords,
} from "@/lib/admin/integrations/microsoft-calendar/queries";
import { RetryMicrosoftCalendarSyncForm } from "@/components/admin/integrations/microsoft-calendar/retry-sync-form";
import { AdminTableShell } from "@/components/admin/shared/admin-table-shell";
import { MobileRecordCard } from "@/components/admin/shared/mobile-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatMode(mode: string) {
  return mode.replaceAll("_", " ");
}

export default async function AdminMicrosoftCalendarIntegrationPage() {
  await requireSuperAdmin();
  const status = await getMicrosoftCalendarIntegrationStatus();
  let records: Awaited<ReturnType<typeof getMicrosoftCalendarSyncRecords>> = [];
  let recordsError: string | null = null;

  try {
    records = await getMicrosoftCalendarSyncRecords();
  } catch (error) {
    recordsError =
      error instanceof Error
        ? error.message
        : "Unable to load Microsoft 365 Calendar sync records.";
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super admin area"
        title="Microsoft 365 Calendar"
        description="Monitor one-way Booking System to Microsoft 365 Calendar sync. Secrets stay in environment variables and are never shown here."
      />

      <section className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm shadow-primary/5 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Status
          </p>
          <p className="mt-1 font-semibold tracking-normal">
            {status.enabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Mode
          </p>
          <p className="mt-1 capitalize">{formatMode(status.mode)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Configured
          </p>
          <p className="mt-1">{status.isConfigured ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Calendar target
          </p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {status.defaultCalendarId || "Not set"}
          </p>
        </div>
      </section>

      {status.validationError ? (
        <Alert variant="warning">
          <AlertDescription>{status.validationError}</AlertDescription>
        </Alert>
      ) : null}

      {recordsError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {recordsError} Confirm migration 0014 has been applied before using
            Microsoft 365 Calendar sync.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminTableShell
        title="Sync records"
        description="Latest Microsoft 365 Calendar sync attempts and outcomes"
        mobileCards={
          records.length > 0 ? (
            records.map((record) => (
              <MobileRecordCard
                key={record.id}
                eyebrow="Microsoft 365"
                title={
                  record.booking ? (
                    <Link
                      href={`/admin/bookings/${record.booking.id}`}
                      className={buttonVariants({
                        variant: "link",
                        size: "sm",
                        className: "h-auto p-0",
                      })}
                    >
                      {record.booking.title}
                    </Link>
                  ) : (
                    "Booking unavailable"
                  )
                }
                badges={
                  <StatusBadge kind="calendar-sync" status={record.status} />
                }
                rows={[
                  {
                    label: "Facility",
                    value: record.booking?.facilityName ?? "Unknown",
                  },
                  {
                    label: "Booking status",
                    value: record.booking?.status ?? "Unknown",
                  },
                  {
                    label: "Attempts",
                    value: String(record.attempts),
                  },
                  {
                    label: "Last synced",
                    value: record.lastSyncedAt
                      ? formatBookingDateTime(record.lastSyncedAt)
                      : "Not synced",
                  },
                  {
                    label: "Last error",
                    value: record.lastError || "None",
                  },
                ]}
                actions={
                  record.booking ? (
                    <RetryMicrosoftCalendarSyncForm
                      bookingId={record.booking.id}
                    />
                  ) : null
                }
              />
            ))
          ) : (
            <EmptyState
              className="bg-transparent"
              title="No calendar sync records yet"
              description="Confirmed and cancelled bookings will create sync records when Microsoft 365 Calendar sync is enabled or attempted."
            />
          )
        }
      >
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Booking status</th>
              <th className="px-4 py-3 font-medium">Sync status</th>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
              <th className="px-4 py-3 font-medium">Last synced</th>
              <th className="px-4 py-3 font-medium">Last error</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">
                    {record.booking ? (
                      <Link
                        href={`/admin/bookings/${record.booking.id}`}
                        className={buttonVariants({
                          variant: "link",
                          size: "sm",
                          className: "h-auto p-0",
                        })}
                      >
                        {record.booking.title}
                      </Link>
                    ) : (
                      "Booking unavailable"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {record.booking?.status ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge kind="calendar-sync" status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {record.booking?.facilityName ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">{record.attempts}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {record.lastSyncedAt
                      ? formatBookingDateTime(record.lastSyncedAt)
                      : "Not synced"}
                  </td>
                  <td className="max-w-[320px] break-words px-4 py-3 text-muted-foreground">
                    {record.lastError || "None"}
                  </td>
                  <td className="px-4 py-3">
                    {record.booking ? (
                      <RetryMicrosoftCalendarSyncForm
                        bookingId={record.booking.id}
                      />
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8" colSpan={8}>
                  <EmptyState
                    className="border-0 bg-transparent py-4"
                    title="No calendar sync records yet"
                    description="Confirmed and cancelled bookings will create sync records when Microsoft 365 Calendar sync is enabled or attempted."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </main>
  );
}
