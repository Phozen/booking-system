"use client";

import { useId, useState } from "react";
import { Menu, X } from "lucide-react";

import { AdminNavigation, EmployeeNavigation } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";

export function MobileNav({
  variant,
  label,
  userMenu,
  className,
  role,
}: {
  variant: "employee" | "admin";
  label: string;
  userMenu?: {
    email?: string | null;
    role?: string | null;
    currentArea: "employee" | "admin";
    profileHref: "/profile" | "/admin/profile";
  };
  className?: string;
  role?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <X data-icon="inline-start" aria-hidden="true" />
        ) : (
          <Menu data-icon="inline-start" aria-hidden="true" />
        )}
        {label}
      </Button>
      {open ? (
        <div
          id={menuId}
          className="qbook-office-panel absolute inset-x-4 top-full z-50 mt-2 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg border border-border p-3 shadow-lg"
        >
          {variant === "admin" ? (
            <AdminNavigation compact onNavigate={close} role={role} />
          ) : (
            <EmployeeNavigation compact onNavigate={close} />
          )}
          {userMenu ? (
            <div className="mt-4 border-t pt-3">
              <UserMenu
                email={userMenu.email}
                role={userMenu.role}
                currentArea={userMenu.currentArea}
                profileHref={userMenu.profileHref}
                className="grid gap-3"
                controlsClassName="flex-row flex-wrap items-center justify-start"
                onNavigate={close}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
