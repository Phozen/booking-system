"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { AdminNavigation, EmployeeNavigation } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/notifications/app-notifications";
import { cn } from "@/lib/utils";

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
    notifications?: AppNotification[];
    unseenNotificationCount?: number;
  };
  className?: string;
  role?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className={className}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          "min-h-11 bg-card/95 transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out active:translate-y-0.5 active:scale-[0.99] active:brightness-95 active:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.22)]",
          open &&
            "translate-y-0.5 scale-[0.99] border-primary/60 bg-accent/95 text-accent-foreground shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.24)]",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <X data-icon="inline-start" aria-hidden="true" />
        ) : (
          <Menu data-icon="inline-start" aria-hidden="true" />
        )}
        {label}
      </Button>
      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-label={label}
        aria-hidden={!open}
        className={cn(
          "qbook-nav-photo absolute inset-x-4 top-full z-50 mt-2 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg border border-border p-3 shadow-lg transition-all duration-200 ease-out origin-top",
          open
            ? "visible translate-y-0 scale-y-100 opacity-100"
            : "invisible -translate-y-2 scale-y-95 opacity-0 pointer-events-none"
        )}
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
                notifications={userMenu.notifications}
                unseenNotificationCount={userMenu.unseenNotificationCount}
                className="grid gap-3"
                controlsClassName="flex-row flex-wrap items-center justify-start"
                onNavigate={close}
              />
            </div>
          ) : null}
        </div>
    </div>
  );
}
