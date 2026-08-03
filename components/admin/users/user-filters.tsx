"use client";

import { Filter, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  formatUserRole,
  formatUserStatus,
  type UserFilters,
  userRoleOptions,
  userStatusOptions,
} from "@/lib/admin/users/validation";
import { AdminFilterBar } from "@/components/admin/shared/admin-filter-bar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function roleLabel(value: (typeof userRoleOptions)[number]) {
  return value === "all" ? "All roles" : formatUserRole(value);
}

function statusLabel(value: (typeof userStatusOptions)[number]) {
  return value === "all" ? "All statuses" : formatUserStatus(value);
}

export function UserFilters({ filters }: { filters: UserFilters }) {
  const router = useRouter();
  const filterKey = `${filters.search ?? ""}:${filters.role ?? "all"}:${filters.status ?? "all"}`;

  function clearFilters() {
    router.replace("/admin/users");
  }

  return (
    <AdminFilterBar title="User filters">
      <form
        key={filterKey}
        action="/admin/users"
        className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end [&>*]:min-w-0"
      >
        <div className="grid gap-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="search"
            name="search"
            type="search"
            defaultValue={filters.search ?? ""}
            placeholder="Name, email, or department"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <Select
            id="role"
            name="role"
            defaultValue={filters.role ?? "all"}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {userRoleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select
            id="status"
            name="status"
            defaultValue={filters.status ?? "all"}
            className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {userStatusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        <button
          type="submit"
          className={buttonVariants({
            variant: "outline",
            className: "w-full md:w-auto",
          })}
        >
          <Filter data-icon="inline-start" />
          Apply
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className={buttonVariants({ variant: "ghost", className: "w-full md:w-auto" })}
        >
          <RotateCcw data-icon="inline-start" />
          Clear
        </button>
      </form>
    </AdminFilterBar>
  );
}
