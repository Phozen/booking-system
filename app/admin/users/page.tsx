import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAdminUsers } from "@/lib/admin/users/queries";
import { parseUserFilters } from "@/lib/admin/users/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserFilters } from "@/components/admin/users/user-filters";
import { UsersTable } from "@/components/admin/users/users-table";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    role?: string | string[];
    status?: string | string[];
  }>;
}) {
  await requireSuperAdmin();
  const filters = parseUserFilters(await searchParams);
  const supabase = createAdminClient();
  const users = await getAdminUsers(supabase, filters);
  const filtersActive = Boolean(filters.search || filters.role || filters.status);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Super admin area"
        title="User management"
        description="Search users, review account status, and update roles or access status without using the Supabase SQL editor."
      />

      <UserFilters filters={filters} />
      <UsersTable users={users} filtersActive={filtersActive} />
    </main>
  );
}
