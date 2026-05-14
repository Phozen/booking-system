import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAdminUserById } from "@/lib/admin/users/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserDetail } from "@/components/admin/users/user-detail";
import { UserEditForm } from "@/components/admin/users/user-edit-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user: currentUser } = await requireSuperAdmin();
  const { id } = await params;
  const supabase = createAdminClient();
  const user = await getAdminUserById(supabase, id);

  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super admin area"
        title={user.fullName || user.email}
        description={
          <span className="break-all">
            Review and update this user&apos;s application profile, role, and access
            status. Password and auth email changes remain in Supabase Auth.
          </span>
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Users", href: "/admin/users" },
          { label: user.fullName || user.email },
        ]}
        secondaryAction={
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to users
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
        <UserDetail user={user} />
        <UserEditForm user={user} currentUserId={currentUser.id} />
      </div>
    </main>
  );
}
