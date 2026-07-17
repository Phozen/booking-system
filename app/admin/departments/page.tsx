import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { saveDepartmentAction } from "@/lib/departments/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function DepartmentsPage() {
  const { profile } = await requireSuperAdmin();
  if (profile?.status !== "active") redirect("/login?error=disabled");
  const { data } = await createAdminClient().from("departments").select("id,name,email,is_active,updated_at").order("name");
  const departments = (data ?? []) as { id: string; name: string; email: string; is_active: boolean; updated_at: string }[];
  return <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader eyebrow="Super admin area" title="Departments" description="Manage booking tags and the mailbox notified for each involved department." />
    <form action={saveDepartmentAction} className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3">
      <div className="grid gap-2"><Label htmlFor="department-name">Department name</Label><Input id="department-name" name="name" required /></div>
      <div className="grid gap-2"><Label htmlFor="department-email">Mailbox</Label><Input id="department-email" name="email" type="email" required /></div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
      <Button className="sm:col-span-3 sm:w-fit">Add department</Button>
    </form>
    <div className="grid gap-4">{departments.map((department) => <form key={department.id} action={saveDepartmentAction} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"><input type="hidden" name="id" value={department.id} /><div className="grid gap-2"><Label>Department</Label><Input name="name" defaultValue={department.name} required /></div><div className="grid gap-2"><Label>Mailbox</Label><Input name="email" type="email" defaultValue={department.email} required /></div><label className="flex items-center gap-2 pb-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={department.is_active} /> Active</label><Button variant="outline">Save</Button></form>)}</div>
  </main>;
}
