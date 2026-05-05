"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useTransition, useState } from "react";

import {
  cancelMaintenanceClosureAction,
  completeMaintenanceClosureAction,
  createMaintenanceClosureAction,
  updateMaintenanceClosureAction,
  type MaintenanceClosureActionResult,
} from "@/lib/admin/maintenance/actions";
import type { MaintenanceClosure } from "@/lib/admin/maintenance/queries";
import {
  formatMaintenanceStatus,
  maintenanceStatusOptions,
} from "@/lib/admin/maintenance/validation";
import type { Facility } from "@/lib/facilities/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const formTimeZone = "Asia/Kuala_Lumpur";

function toDateTimeInputs(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: formTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${lookup.year}-${lookup.month}-${lookup.day}`,
    time: `${lookup.hour}:${lookup.minute}`,
  };
}

export function MaintenanceForm({
  maintenanceClosure,
  facilities,
}: {
  maintenanceClosure?: MaintenanceClosure;
  facilities: Facility[];
}) {
  const router = useRouter();
  const [result, setResult] = useState<MaintenanceClosureActionResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [isStatusPending, setIsStatusPending] = useState(false);
  const isBusy = isPending || isStatusPending;
  const startsAt = maintenanceClosure
    ? toDateTimeInputs(maintenanceClosure.startsAt)
    : { date: "", time: "" };
  const endsAt = maintenanceClosure
    ? toDateTimeInputs(maintenanceClosure.endsAt)
    : { date: "", time: "" };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const actionResult = maintenanceClosure
        ? await updateMaintenanceClosureAction(maintenanceClosure.id, formData)
        : await createMaintenanceClosureAction(formData);

      setResult(actionResult);

      if (actionResult.status === "success") {
        router.refresh();

        if (!maintenanceClosure && actionResult.maintenanceClosureId) {
          router.push(`/admin/maintenance/${actionResult.maintenanceClosureId}`);
        }
      }
    });
  }

  async function runStatusAction(action: "complete" | "cancel") {
    if (!maintenanceClosure) {
      return;
    }

    setIsStatusPending(true);

    try {
      const actionResult =
        action === "complete"
          ? await completeMaintenanceClosureAction(maintenanceClosure.id)
          : await cancelMaintenanceClosureAction(maintenanceClosure.id);

      setResult(actionResult);

      if (actionResult.status === "success") {
        router.refresh();
      }
    } finally {
      setIsStatusPending(false);
    }
  }

  const canChangeStatus =
    maintenanceClosure?.status === "scheduled" ||
    maintenanceClosure?.status === "in_progress";

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      {result ? (
        <Alert variant={result.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold tracking-normal">Basic details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the facility and describe the maintenance work.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="facilityId">Facility</Label>
          <select
            id="facilityId"
            name="facilityId"
            defaultValue={maintenanceClosure?.facilityId ?? ""}
            required
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select a facility
            </option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}, {facility.level} ({facility.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={maintenanceClosure?.title ?? ""}
            required
          />
        </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold tracking-normal">Schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled and in-progress maintenance prevents bookings during this
            window.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={startsAt.date}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={startsAt.time}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={endsAt.date}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endTime">End time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={endsAt.time}
            required
          />
        </div>

        {maintenanceClosure ? (
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={maintenanceClosure.status}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {maintenanceStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatMaintenanceStatus(status)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="status" value="scheduled" />
        )}
      </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold tracking-normal">Reason</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add operational context for admins reviewing this closure later.
          </p>
        </div>

      <div className="grid gap-2">
        <Label htmlFor="reason">Reason</Label>
        <textarea
          id="reason"
          name="reason"
          defaultValue={maintenanceClosure?.reason ?? ""}
          rows={4}
          maxLength={1000}
          className="min-h-24 rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      </section>

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        {canChangeStatus ? (
          <>
            <ConfirmDialog
              triggerLabel="Mark completed"
              title="Mark this maintenance closure completed?"
              description="The maintenance closure will be marked completed. Once completed, it will no longer block future bookings."
              confirmLabel="Mark completed"
              cancelLabel="Keep current status"
              pendingLabel="Saving..."
              disabled={isPending}
              pending={isStatusPending}
              onConfirm={() => runStatusAction("complete")}
            />
            <ConfirmDialog
              triggerLabel="Cancel maintenance"
              title="Cancel this maintenance closure?"
              description="The maintenance closure will be cancelled and will no longer block bookings."
              confirmLabel="Cancel maintenance"
              cancelLabel="Keep current status"
              pendingLabel="Cancelling..."
              destructive
              disabled={isPending}
              pending={isStatusPending}
              onConfirm={() => runStatusAction("cancel")}
            />
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => router.push("/admin/maintenance")}
        >
          Back
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isPending || isStatusPending
            ? "Saving..."
            : maintenanceClosure
              ? "Save closure"
              : "Create closure"}
        </Button>
      </div>
    </form>
  );
}
