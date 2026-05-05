import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/guards";
import { AppHeader } from "@/components/app/app-header";

export const dynamic = "force-dynamic";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireUser();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader email={user.email} role={profile.role} />
      {children}
    </div>
  );
}
