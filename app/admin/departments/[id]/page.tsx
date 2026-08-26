import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAdminDepartmentById } from "@/lib/admin/departments/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepartmentManager } from "@/components/admin/departments/department-manager";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const department = await getAdminDepartmentById(createAdminClient(), id);
  if (!department) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super admin area"
        title={department.name}
        backAction={
          <Link
            href="/admin/departments"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to departments
          </Link>
        }
      />
      <DepartmentManager department={department} />
    </main>
  );
}
