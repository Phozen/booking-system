import { z } from "zod";

export const departmentStatusOptions = ["all", "active", "inactive"] as const;
export type DepartmentStatus = Exclude<(typeof departmentStatusOptions)[number], "all">;

export type DepartmentFilters = {
  search?: string;
  status?: DepartmentStatus;
};

export type DepartmentFilterInput = {
  search?: string | string[];
  status?: string | string[];
};

const departmentFilterSchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(departmentStatusOptions).optional(),
});

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDepartmentFilters(input: DepartmentFilterInput): DepartmentFilters {
  const parsed = departmentFilterSchema.safeParse({
    search: firstValue(input.search),
    status: firstValue(input.status),
  });

  if (!parsed.success) return {};

  return {
    search: parsed.data.search || undefined,
    status: parsed.data.status === "all" ? undefined : parsed.data.status,
  };
}
