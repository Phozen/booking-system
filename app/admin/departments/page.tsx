import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminDepartments } from "@/lib/admin/departments/queries";
import { parseDepartmentFilters } from "@/lib/admin/departments/validation";
import { PageHeader } from "@/components/shared/page-header";
import { DepartmentCreateForm } from "@/components/admin/departments/department-create-form";
import { DepartmentsTable } from "@/components/admin/departments/departments-table";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[]; status?: string | string[] }>;
}) {
  await requireSuperAdmin();
  const filters = parseDepartmentFilters(await searchParams);
  const departments = await getAdminDepartments(createAdminClient(), filters);

  return <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader eyebrow="Super admin area" title="Departments" />
    <DepartmentCreateForm />
    <DepartmentsTable departments={departments} filters={filters} />
  </main>;
}
