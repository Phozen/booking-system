"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  createBlockedPeriodAction,
  deactivateBlockedPeriodAction,
  updateBlockedPeriodAction,
  type BlockedPeriodActionResult,
} from "@/lib/admin/blocked-periods/actions";
import {
  blockedPeriodScopeOptions,
  formatBlockedPeriodScope,
  type BlockedPeriodScope,
} from "@/lib/admin/blocked-periods/validation";
import type { BlockedPeriod } from "@/lib/admin/blocked-periods/queries";
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

export function BlockedPeriodForm({
  blockedPeriod,
  facilities,
}: {
  blockedPeriod?: BlockedPeriod;
  facilities: Facility[];
}) {
  const router = useRouter();
  const [result, setResult] = useState<BlockedPeriodActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [scope, setScope] = useState<BlockedPeriodScope>(
    blockedPeriod?.scope ?? "selected_facilities",
  );
  const isBusy = isPending || isStatusPending;

  const selectedFacilityIds = useMemo(
    () => new Set(blockedPeriod?.facilities.map((facility) => facility.id) ?? []),
    [blockedPeriod],
  );
  const startsAt = blockedPeriod
    ? toDateTimeInputs(blockedPeriod.startsAt)
    : { date: "", time: "" };
  const endsAt = blockedPeriod
    ? toDateTimeInputs(blockedPeriod.endsAt)
    : { date: "", time: "" };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const actionResult = blockedPeriod
        ? await updateBlockedPeriodAction(blockedPeriod.id, formData)
        : await createBlockedPeriodAction(formData);

      setResult(actionResult);

      if (actionResult.status === "success") {
        router.refresh();

        if (!blockedPeriod && actionResult.blockedPeriodId) {
          router.push(`/admin/blocked-dates/${actionResult.blockedPeriodId}`);
        }
      }
    });
  }

  async function onDeactivate() {
    if (!blockedPeriod) {
      return;
    }

    setIsStatusPending(true);

    try {
      const actionResult = await deactivateBlockedPeriodAction(blockedPeriod.id);
      setResult(actionResult);

      if (actionResult.status === "success") {
        router.refresh();
      }
    } finally {
      setIsStatusPending(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      {result ? (
        <Alert variant={result.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold tracking-normal">Basic details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Name the blocked period and choose whether it applies everywhere or
            only to selected facilities.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={blockedPeriod?.title ?? ""}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="scope">Scope</Label>
          <select
            id="scope"
            name="scope"
            value={scope}
            onChange={(event) =>
              setScope(event.target.value as BlockedPeriodScope)
            }
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {blockedPeriodScopeOptions.map((option) => (
              <option key={option} value={option}>
                {formatBlockedPeriodScope(option)}
              </option>
            ))}
          </select>
        </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold tracking-normal">Schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Times are shown in Asia/Kuala_Lumpur. The start must be before the
            end.
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
      </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold tracking-normal">Reason and impact</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Active blocked periods prevent new bookings for the affected
            facilities.
          </p>
        </div>

      <div className="grid gap-2">
        <Label htmlFor="reason">Reason</Label>
        <textarea
          id="reason"
          name="reason"
          defaultValue={blockedPeriod?.reason ?? ""}
          rows={4}
          maxLength={1000}
          className="min-h-24 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {scope === "selected_facilities" ? (
        <fieldset className="grid gap-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Affected facilities</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {facilities.map((facility) => (
              <label
                key={facility.id}
                className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="facilityIds"
                  value={facility.id}
                  defaultChecked={selectedFacilityIds.has(facility.id)}
                  className="size-4"
                />
                <span>
                  {facility.name}, {facility.level}
                  <span className="ml-1 text-muted-foreground">
                    ({facility.code})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="flex w-fit items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={blockedPeriod?.isActive ?? true}
          className="size-4"
        />
        Active
      </label>
      </section>

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {blockedPeriod?.isActive ? (
          <ConfirmDialog
            triggerLabel="Deactivate"
            title="Deactivate this blocked period?"
            description="This blocked period will stop preventing bookings for the affected facilities. Existing bookings and audit history are preserved."
            confirmLabel="Deactivate blocked period"
            cancelLabel="Keep active"
            pendingLabel="Deactivating..."
            destructive
            disabled={isPending}
            pending={isStatusPending}
            triggerClassName="w-full sm:w-auto"
            onConfirm={onDeactivate}
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => router.push("/admin/blocked-dates")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isPending || isStatusPending
            ? "Saving..."
            : blockedPeriod
              ? "Save blocked period"
              : "Create blocked period"}
        </Button>
      </div>
    </form>
  );
}
