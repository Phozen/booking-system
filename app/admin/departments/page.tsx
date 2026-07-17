import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { DepartmentManager } from "@/components/admin/departments/department-manager";

export default async function DepartmentsPage() {
  const { profile } = await requireSuperAdmin();
  if (profile?.status !== "active") redirect("/login?error=disabled");
  const { data } = await createAdminClient().from("departments").select("id,name,email,is_active,updated_at").order("name");
  const departments = ((data ?? []) as { id: string; name: string; email: string; is_active: boolean; updated_at: string }[]).map((department) => ({ id: department.id, name: department.name, email: department.email, isActive: department.is_active }));
  return <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader eyebrow="Super admin area" title="Departments" description="Manage booking tags and the mailbox notified for each involved department." />
    <DepartmentManager departments={departments} />
  </main>;
}
