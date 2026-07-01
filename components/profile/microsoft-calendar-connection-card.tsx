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
}: {
  connection: MicrosoftCalendarConnectionStatus;
  calendarMessage?: "connected" | "error";
}) {
  const needsReconnect =
    connection.status === "reconnect_required" ||
    connection.status === "not_connected";

  return (
    <section className="grid gap-4 rounded-lg border border-border/70 bg-card p-5 shadow-sm ring-1 ring-primary/5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <CalendarCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-normal">
            Microsoft Calendar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {connection.connected
              ? "Connected for delegated booking calendar sync."
              : "Connect Microsoft Calendar so your bookings can sync to Outlook."}
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
        <Button type="submit" variant={needsReconnect ? "default" : "outline"}>
          <RefreshCcw aria-hidden="true" />
          {needsReconnect ? "Connect Microsoft Calendar" : "Reconnect"}
        </Button>
      </form>
    </section>
  );
}
