"use client";

import { Filter, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { departmentStatusOptions, type DepartmentFilters } from "@/lib/admin/departments/validation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function DepartmentFilters({ filters }: { filters: DepartmentFilters }) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState(filters.status ?? "all");

  useEffect(() => {
    setSearch(filters.search ?? "");
    setStatus(filters.status ?? "all");
  }, [filters.search, filters.status]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    router.replace("/admin/departments");
  }

  return (
    <form action="/admin/departments" className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] md:items-end [&>*]:min-w-0">
      <div className="grid gap-2">
        <label htmlFor="search" className="text-sm font-medium">Search</label>
        <Input
          id="search"
          name="search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Department name or mailbox"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="status" className="text-sm font-medium">Status</label>
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {departmentStatusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : option === "active" ? "Active" : "Inactive"}
            </option>
          ))}
        </Select>
      </div>
      <button type="submit" className={buttonVariants({ variant: "outline", className: "w-full md:w-auto" })}>
        <Filter data-icon="inline-start" />
        Apply
      </button>
      <button type="button" onClick={clearFilters} className={buttonVariants({ variant: "ghost", className: "w-full md:w-auto" })}>
        <RotateCcw data-icon="inline-start" />
        Clear
      </button>
    </form>
  );
}
