"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { AdminNavigation, EmployeeNavigation } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/notifications/app-notifications";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Matches Tailwind `lg` (admin shell) and `xl` (employee header). */
const COLLAPSE_MEDIA = {
  admin: "(min-width: 1024px)",
  employee: "(min-width: 1280px)",
} as const;

function clearBodyScrollLock() {
  document.body.style.overflow = "";
}

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
  const pathname = usePathname();

  const close = () => {
    clearBodyScrollLock();
    setOpen(false);
  };

  // Close when navigating so a leftover open state cannot keep body locked.
  useEffect(() => {
    clearBodyScrollLock();
    setOpen(false);
  }, [pathname]);

  // Close when the shell hides this nav at desktop breakpoints.
  useEffect(() => {
    const media = window.matchMedia(COLLAPSE_MEDIA[variant]);

    function onBreakpointChange(event: MediaQueryListEvent | MediaQueryList) {
      if (event.matches) {
        clearBodyScrollLock();
        setOpen(false);
      }
    }

    onBreakpointChange(media);
    media.addEventListener("change", onBreakpointChange);
    return () => media.removeEventListener("change", onBreakpointChange);
  }, [variant]);

  useEffect(() => {
    if (!open) {
      clearBodyScrollLock();
      return;
    }

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function getFocusable() {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.getAttribute("aria-hidden") !== "true" &&
          el.tabIndex !== -1,
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        clearBodyScrollLock();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    const focusable = getFocusable();
    (focusable[0] ?? panel)?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearBodyScrollLock();
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      } else {
        triggerRef.current?.focus();
      }
    };
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="dialog"
        className={cn(
          "min-h-11 bg-card/95 transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out active:translate-y-0.5 active:scale-[0.99] active:brightness-95 active:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.22)]",
          open &&
            "translate-y-0.5 scale-[0.99] border-primary/60 bg-accent/95 text-accent-foreground shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.24)]",
        )}
        onClick={() =>
          setOpen((current) => {
            if (current) {
              clearBodyScrollLock();
              return false;
            }
            return true;
          })
        }
      >
        {open ? (
          <X data-icon="inline-start" aria-hidden="true" />
        ) : (
          <Menu data-icon="inline-start" aria-hidden="true" />
        )}
        {label}
      </Button>

      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-foreground/40"
          onClick={close}
        />
      ) : null}

      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label={label}
        aria-hidden={!open}
        tabIndex={-1}
        className={cn(
          "qbook-nav-photo absolute inset-x-4 top-full z-50 mt-2 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg border border-border p-3 shadow-lg transition-all duration-200 ease-out origin-top",
          open
            ? "visible translate-y-0 scale-y-100 opacity-100"
            : "invisible -translate-y-2 scale-y-95 opacity-0 pointer-events-none",
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
