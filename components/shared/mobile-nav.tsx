"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { Menu, X } from "lucide-react";

import { AdminNavigation, EmployeeNavigation } from "@/components/shared/nav-links";
import { Button } from "@/components/ui/button";

export function MobileNav({
  variant,
  label,
  footer,
  className,
}: {
  variant: "employee" | "admin";
  label: string;
  footer?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const Navigation = variant === "admin" ? AdminNavigation : EmployeeNavigation;

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
          className="absolute inset-x-4 top-full z-50 mt-2 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg border border-border/70 bg-card p-3 shadow-xl"
        >
          <Navigation compact onNavigate={() => setOpen(false)} />
          {footer ? <div className="mt-4 border-t pt-3">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
