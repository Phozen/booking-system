"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Save, Search, X } from "lucide-react";

import {
  updateBookingDepartmentsAction,
  type BookingDepartmentActionResult,
} from "@/lib/bookings/actions";
import type { Department } from "@/lib/departments/queries";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [query, setQuery] = useState("");
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
  const normalizedQuery = query.trim().toLowerCase();
  const selectedDepartmentIdSet = useMemo(
    () => new Set(selectedDepartmentIds),
    [selectedDepartmentIds],
  );
  const selectedDepartments = departments.filter((department) =>
    selectedDepartmentIdSet.has(department.id),
  );
  const matchingDepartments = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return [];
    }

    return departments.filter(
      (department) =>
        !selectedDepartmentIdSet.has(department.id) &&
        `${department.name} ${department.email}`
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [departments, normalizedQuery, selectedDepartmentIdSet]);
  const isDirty = useMemo(() => {
    const selected = [...selectedDepartmentIds].sort();
    const saved = [...savedDepartmentIds].sort();

    return (
      selected.length !== saved.length ||
      selected.some((id, index) => id !== saved[index])
    );
  }, [savedDepartmentIds, selectedDepartmentIds]);

  function addDepartment(department: Department) {
    if (
      selectedDepartmentIdSet.has(department.id) ||
      selectedDepartmentIds.length >= 50
    ) {
      return;
    }

    setSelectedDepartmentIds((current) => [...current, department.id]);
    setActionState(departmentActionInitialState);
  }

  function removeDepartment(departmentId: string) {
    setSelectedDepartmentIds((current) =>
      current.filter((id) => id !== departmentId),
    );
    setActionState(departmentActionInitialState);
  }

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
        setQuery("");
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

      <div className="grid gap-2">
        <Label htmlFor="department-invite-search">Add departments</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="department-invite-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search department or email"
            className="pl-9"
            aria-describedby="department-invite-search-helper department-invite-search-status"
            autoComplete="off"
            disabled={isSaving}
          />
        </div>
        <FormFieldHelper id="department-invite-search-helper">
          Enter at least 2 characters. Active department mailboxes receive booking notifications.
        </FormFieldHelper>
        <p
          id="department-invite-search-status"
          className="sr-only"
          aria-live="polite"
        >
          {normalizedQuery.length >= 2
            ? `${matchingDepartments.length} matching departments found`
            : "Enter at least 2 characters to search"}
        </p>
      </div>

      {normalizedQuery.length >= 2 ? (
        matchingDepartments.length > 0 ? (
          <ul
            className="max-h-72 divide-y overflow-y-auto rounded-lg border border-border/75 bg-card"
            aria-label="Matching departments"
          >
            {matchingDepartments.map((department) => (
              <li key={department.id}>
                <button
                  type="button"
                  onClick={() => addDepartment(department)}
                  disabled={selectedDepartmentIds.length >= 50 || isSaving}
                  className="grid min-h-14 w-full gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-medium">{department.name}</span>
                  <span className="break-all text-sm text-muted-foreground">
                    {department.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No additional active departments match this search.
          </p>
        )
      ) : null}

      <div className="grid gap-3" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Selected departments</h3>
          <span className="text-sm text-muted-foreground">
            {selectedDepartments.length} / 50
          </span>
        </div>

        {selectedDepartments.length > 0 ? (
          <ul className="grid gap-2">
            {selectedDepartments.map((department) => (
              <li
                key={department.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {department.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {department.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDepartment(department.id)}
                  disabled={isSaving}
                  aria-label={`Remove ${department.name}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Search for departments and add one or more department mailboxes.
          </p>
        )}
      </div>

      {actionState.status !== "idle" ? (
        <Alert variant={actionState.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{actionState.message}</AlertDescription>
        </Alert>
      ) : null}

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
