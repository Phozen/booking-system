"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import type { Department } from "@/lib/departments/queries";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldHelper } from "@/components/shared/form-field-helper";

export function DepartmentPicker({
  departments,
  initialDepartmentIds = [],
  disabled,
  onSelectedCountChange,
  onDraftChange,
}: {
  departments: Department[];
  initialDepartmentIds?: string[];
  disabled?: boolean;
  onSelectedCountChange?: (count: number) => void;
  onDraftChange?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectionStatus, setSelectionStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState(() =>
    initialDepartmentIds.filter((id) => departments.some((item) => item.id === id)),
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selected = departments.filter((department) => selectedIds.includes(department.id));
  const normalizedQuery = query.trim().toLowerCase();
  const isAtSelectionLimit = selected.length >= 50;
  const available = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return departments.filter(
      (department) =>
        !selectedIds.includes(department.id) &&
        `${department.name} ${department.email}`.toLowerCase().includes(normalizedQuery),
    );
  }, [departments, query, selectedIds]);

  useEffect(() => {
    onSelectedCountChange?.(selected.length);
  }, [onSelectedCountChange, selected.length]);

  return (
    <div className="grid gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="qbook-type-section text-base">Involved departments</p>
        <FieldRequirementBadge required={false} />
      </div>
      {departments.length > 0 ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="department-search">Search departments</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                id="department-search"
                type="search"
                className="pl-9"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectionStatus("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                disabled={disabled}
                placeholder="Department name or email"
                aria-describedby="department-search-helper department-search-status"
              />
            </div>
            <FormFieldHelper id="department-search-helper">Enter at least 2 characters, then select one or more departments.</FormFieldHelper>
            <p id="department-search-status" className="sr-only" role="status" aria-live="polite">
              {selectionStatus || (normalizedQuery.length >= 2 ? `${available.length} matching departments found` : "Enter at least 2 characters to search")}
            </p>
          </div>
          {isAtSelectionLimit ? (
            <p className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
              Maximum 50 departments selected. Remove one to add another.
            </p>
          ) : available.length > 0 ? (
            <div className="rounded-md border border-dashed bg-muted/40 p-1">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search results</p>
              <ul className="grid gap-1" aria-label="Matching departments">
                {available.map((department) => (
                  <li key={department.id}>
                    <button
                      type="button"
                      className="w-full cursor-pointer rounded-sm border border-transparent px-3 py-2 text-left transition hover:border-primary/35 hover:bg-background hover:shadow-sm focus-visible:border-primary focus-visible:bg-background focus-visible:outline-none"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedIds((current) => [...current, department.id]);
                        setSelectionStatus(`${department.name} added to departments.`);
                        onDraftChange?.();
                        setQuery("");
                        requestAnimationFrame(() => searchInputRef.current?.focus());
                      }}
                    >
                      <span className="block font-medium">{department.name}</span>
                      <span className="text-xs text-muted-foreground">{department.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : normalizedQuery.length >= 2 ? (
            <p className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">No active departments match this search.</p>
          ) : null}
          {selected.length > 0 ? (
            <ul className="grid gap-2">
              {selected.map((department) => (
                <li key={department.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <input type="hidden" name="departmentId" value={department.id} />
                  <span className="min-w-0"><span className="block font-medium">{department.name}</span><span className="block truncate text-xs text-muted-foreground">{department.email}</span></span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    aria-label={`Remove ${department.name}`}
                    onClick={() => {
                      setSelectedIds((current) =>
                        current.filter((id) => id !== department.id),
                      );
                      setSelectionStatus(`${department.name} removed from departments.`);
                      onDraftChange?.();
                    }}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-muted-foreground">No active departments are available. A Super Admin can add one when ready.</p>
      )}
    </div>
  );
}
