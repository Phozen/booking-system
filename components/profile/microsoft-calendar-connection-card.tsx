import { CalendarCheck, RefreshCcw } from "lucide-react";

import { connectMicrosoftCalendarAction } from "@/lib/auth/actions";
import { formatBookingDateTime } from "@/lib/bookings/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type MicrosoftCalendarConnectionStatus = {
  connected: boolean;
  status: "not_connected" | "connected" | "reconnect_required";
  microsoftEmail: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
};

export function MicrosoftCalendarConnectionCard({
  connection,
  calendarMessage,
  calendarSyncReady,
}: {
  connection: MicrosoftCalendarConnectionStatus;
  calendarMessage?: "connected" | "error" | "unavailable";
  calendarSyncReady: boolean;
}) {
  const needsReconnect =
    connection.status === "reconnect_required" ||
    connection.status === "not_connected";

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-normal">
            Microsoft Calendar
          </h3>
          <p className="qbook-type-meta mt-1">
            {connection.connected
              ? "Connected for delegated booking calendar sync."
              : calendarSyncReady
                ? "Connect Microsoft Calendar so your bookings can sync to Outlook."
                : "Calendar sync is not configured yet. Ask a system administrator to complete the Microsoft 365 setup."}
          </p>
        </div>
      </div>

      {calendarMessage === "connected" ? (
        <Alert variant="success">
          <AlertDescription>
            Microsoft Calendar connection updated.
          </AlertDescription>
        </Alert>
      ) : null}

      {calendarMessage === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>
            Microsoft Calendar connection could not be completed. Try again.
          </AlertDescription>
        </Alert>
      ) : null}

      {calendarMessage === "unavailable" ? (
        <Alert variant="warning">
          <AlertDescription>
            Calendar sync is not ready for connection. Ask a system administrator
            to complete the Microsoft 365 setup first.
          </AlertDescription>
        </Alert>
      ) : null}

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </dt>
          <dd className="mt-1 font-medium">
            {connection.status === "connected"
              ? "Connected"
              : connection.status === "reconnect_required"
                ? "Reconnect required"
                : "Not connected"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Microsoft account
          </dt>
          <dd className="mt-1 min-w-0 break-words font-medium [overflow-wrap:anywhere]">
            {connection.microsoftEmail ?? "Not connected"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last connected
          </dt>
          <dd className="mt-1 font-medium">
            {connection.lastConnectedAt
              ? formatBookingDateTime(connection.lastConnectedAt)
              : "Not recorded"}
          </dd>
        </div>
      </dl>

      {connection.lastError ? (
        <Alert variant="warning">
          <AlertDescription>{connection.lastError}</AlertDescription>
        </Alert>
      ) : null}

      <form action={connectMicrosoftCalendarAction}>
        <Button
          type="submit"
          disabled={!calendarSyncReady}
          variant={needsReconnect ? "default" : "outline"}
        >
          <RefreshCcw aria-hidden="true" />
          {needsReconnect ? "Connect Microsoft Calendar" : "Reconnect"}
        </Button>
      </form>
    </section>
  );
}
