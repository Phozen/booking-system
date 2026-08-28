"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { AdminNavigation, EmployeeNavigation } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/notifications/app-notifications";
import { cn } from "@/lib/utils";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

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
  const mounted = useIsClient();

  const [menuPath, setMenuPath] = useState(pathname);
  const close = () => {
    clearBodyScrollLock();
    setOpen(false);
  };

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const media = window.matchMedia(COLLAPSE_MEDIA[variant]);

    function onBreakpointChange() {
      if (media.matches) {
        clearBodyScrollLock();
        setOpen(false);
      }
    }

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

      {mounted && open
        ? createPortal(
            <>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Close menu"
                className="fixed inset-0 z-[70] bg-foreground/40"
                onClick={close}
              />
              <div
                ref={panelRef}
                id={menuId}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                tabIndex={-1}
                className={cn(
                  "fixed z-[80] flex max-h-[min(36rem,calc(100svh-5.5rem-env(safe-area-inset-bottom,0px)))] w-[min(22rem,calc(100svw-2rem))] max-w-[calc(100svw-2rem)] flex-col overflow-hidden overscroll-contain rounded-lg border border-border bg-card p-0 shadow-lg outline-none",
                  "end-4 start-auto",
                  variant === "admin"
                    ? "top-[calc(5.25rem+env(safe-area-inset-top,0px))]"
                    : "top-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:top-[calc(4.25rem+env(safe-area-inset-top,0px))]",
                )}
              >
                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
                  {variant === "admin" ? (
                    <AdminNavigation compact onNavigate={close} role={role} />
                  ) : (
                    <EmployeeNavigation compact onNavigate={close} />
                  )}
                </div>
                {userMenu ? (
                  <div className="shrink-0 border-t border-border bg-card p-3">
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
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
