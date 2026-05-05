import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdmin();

  return (
    <AdminShell email={user.email} role={profile.role}>
      {children}
    </AdminShell>
  );
}
