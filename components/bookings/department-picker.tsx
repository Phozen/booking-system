"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import type { Department } from "@/lib/departments/queries";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DepartmentPicker({
  departments,
  initialDepartmentIds = [],
  disabled,
}: {
  departments: Department[];
  initialDepartmentIds?: string[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() =>
    initialDepartmentIds.filter((id) => departments.some((item) => item.id === id)),
  );
  const selected = departments.filter((department) => selectedIds.includes(department.id));
  const available = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 2) return [];
    return departments.filter(
      (department) =>
        !selectedIds.includes(department.id) &&
        `${department.name} ${department.email}`.toLowerCase().includes(normalizedQuery),
    );
  }, [departments, query, selectedIds]);

  return (
    <section className="grid gap-3 border-b-2 border-border pb-7 text-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Departments</p>
          <FieldRequirementBadge required={false} />
        </div>
        <h2 className="mt-1 text-lg font-bold tracking-normal">Involved departments</h2>
      </div>
      {departments.length > 0 ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="department-search">Search departments</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="department-search" type="search" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} disabled={disabled} placeholder="Department name or email" />
            </div>
            <p className="text-xs text-muted-foreground">Enter at least 2 characters, then select one or more departments.</p>
          </div>
          {available.length > 0 ? (
            <div className="rounded-md border border-dashed bg-muted/40 p-1">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search results</p>
              <ul className="grid gap-1">
                {available.map((department) => (
                  <li key={department.id}>
                    <button type="button" className="w-full cursor-pointer rounded-sm border border-transparent px-3 py-2 text-left transition hover:border-primary/35 hover:bg-background hover:shadow-sm focus-visible:border-primary focus-visible:bg-background focus-visible:outline-none" disabled={disabled} onClick={() => { setSelectedIds((current) => current.length < 50 ? [...current, department.id] : current); setQuery(""); }}>
                      <span className="block font-medium">{department.name}</span>
                      <span className="text-xs text-muted-foreground">{department.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {selected.length > 0 ? (
            <ul className="grid gap-2">
              {selected.map((department) => (
                <li key={department.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <input type="hidden" name="departmentId" value={department.id} />
                  <span className="min-w-0"><span className="block font-medium">{department.name}</span><span className="block truncate text-xs text-muted-foreground">{department.email}</span></span>
                  <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Remove ${department.name}`} onClick={() => setSelectedIds((current) => current.filter((id) => id !== department.id))}><X /></Button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-muted-foreground">No active departments are available. A Super Admin can add one when ready.</p>
      )}
    </section>
  );
}
