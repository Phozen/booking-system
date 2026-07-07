"use client";

import { useActionState } from "react";

import {
  adminCreateBookingAction,
  type AdminBookingActionResult,
} from "@/lib/admin/bookings/actions";
import type { AdminBookingUserOption } from "@/lib/admin/bookings/queries";
import {
  formatBookingWindowLabel,
} from "@/lib/settings/app-settings";
import type { Facility } from "@/lib/facilities/queries";
import type { AppSettings } from "@/lib/settings/app-settings";
import { formatFacilityType } from "@/lib/facilities/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { PendingButtonContent } from "@/components/shared/pending-button-content";

const initialState: AdminBookingActionResult = {
  status: "idle",
  message: "",
};

export function AdminCreateBookingForm({
  facilities,
  users,
  settings,
}: {
  facilities: Facility[];
  users: AdminBookingUserOption[];
  settings: AppSettings;
}) {
  const [state, formAction, isPending] = useActionState(
    adminCreateBookingAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="targetUserId">Booking owner</Label>
          <select
            id="targetUserId"
            name="targetUserId"
            disabled={isPending}
            required
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          >
            <option value="">Choose active user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName ? `${user.fullName} - ` : ""}
                {user.email}
                {user.department ? ` (${user.department})` : ""}
              </option>
            ))}
          </select>
          <FormFieldHelper id="targetUserId-helper">
            Only active users can own admin-created bookings.
          </FormFieldHelper>
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="facilityId">Facility</Label>
          <select
            id="facilityId"
            name="facilityId"
            disabled={isPending}
            required
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          >
            <option value="">Choose facility</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.level} -{" "}
                {formatFacilityType(facility.type)} - Capacity{" "}
                {facility.capacity}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" disabled={isPending} required />
          <FormFieldHelper id="date-helper">
            Booking times use {settings.defaultTimezone}.
          </FormFieldHelper>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="attendeeCount">Attendee count</Label>
          <Input
            id="attendeeCount"
            name="attendeeCount"
            type="number"
            min={0}
            disabled={isPending}
            placeholder="Optional"
          />
        </div>

        <fieldset className="grid gap-2 sm:col-span-2">
          <legend className="text-sm font-medium">Time</legend>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
            <div className="grid min-w-0 gap-1">
              <Label htmlFor="startTime" className="text-xs text-muted-foreground">
                Start
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                min={settings.bookingWindowStart}
                max={settings.bookingWindowEnd}
                disabled={isPending}
                required
              />
            </div>
            <span className="pb-2 text-sm text-muted-foreground" aria-hidden="true">
              to
            </span>
            <div className="grid min-w-0 gap-1">
              <Label htmlFor="endTime" className="text-xs text-muted-foreground">
                End
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                min={settings.bookingWindowStart}
                max={settings.bookingWindowEnd}
                disabled={isPending}
                required
              />
            </div>
          </div>
          <FormFieldHelper id="time-helper">
            Times use {settings.defaultTimezone}. Booking hours are {formatBookingWindowLabel(settings)}.
          </FormFieldHelper>
        </fieldset>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Purpose</Label>
          <Input
            id="title"
            name="title"
            maxLength={160}
            disabled={isPending}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          disabled={isPending}
          className="min-h-28 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
        />
      </div>

      <input type="hidden" name="cateringRequired" value="no" />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <PendingButtonContent
            pending={isPending}
            pendingLabel="Creating booking..."
          >
            Create booking
          </PendingButtonContent>
        </Button>
      </div>
    </form>
  );
}
