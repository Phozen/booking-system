"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";

import {
  updateBookingDepartmentsAction,
  type BookingDepartmentActionResult,
} from "@/lib/bookings/actions";
import type { Department } from "@/lib/departments/queries";
import { DepartmentPicker } from "@/components/bookings/department-picker";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { Button } from "@/components/ui/button";

const departmentActionInitialState: BookingDepartmentActionResult = {
  status: "idle",
  message: "",
};

export function BookingDepartmentManager({
  bookingId,
  departments,
  initialDepartmentIds,
}: {
  bookingId: string;
  departments: Department[];
  initialDepartmentIds: string[];
}) {
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState(
    initialDepartmentIds,
  );
  const [savedDepartmentIds, setSavedDepartmentIds] = useState(
    initialDepartmentIds,
  );
  const [actionState, setActionState] = useState(
    departmentActionInitialState,
  );
  const [isSaving, startSaving] = useTransition();
  const isDirty = useMemo(() => {
    const selected = [...selectedDepartmentIds].sort();
    const saved = [...savedDepartmentIds].sort();

    return (
      selected.length !== saved.length ||
      selected.some((id, index) => id !== saved[index])
    );
  }, [savedDepartmentIds, selectedDepartmentIds]);

  function saveDepartments() {
    if (!isDirty || isSaving) {
      return;
    }

    startSaving(async () => {
      const result = await updateBookingDepartmentsAction(
        bookingId,
        selectedDepartmentIds,
      );
      setActionState(result);

      if (result.status === "success") {
        setSavedDepartmentIds(selectedDepartmentIds);
      }
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border/75 bg-background p-4">
      <ActionToastEffect
        state={actionState}
        successTitle="Departments updated"
        errorTitle="Departments not updated"
      />
      <DepartmentPicker
        departments={departments}
        selectedDepartmentIds={selectedDepartmentIds}
        onSelectedDepartmentIdsChange={setSelectedDepartmentIds}
        disabled={isSaving}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={saveDepartments}
          disabled={!isDirty || isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2
              data-icon="inline-start"
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Save data-icon="inline-start" aria-hidden="true" />
          )}
          {isSaving ? "Saving departments..." : "Save departments"}
        </Button>
      </div>
    </section>
  );
}
