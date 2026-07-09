"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  adminNavigationGroups,
  employeeNavigation,
  getAdminNavigationGroups,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActivePath(
  pathname: string,
  href: string,
  match: "exact" | "prefix",
) {
  if (match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({
  item,
  compact,
  onNavigate,
}: {
  item: (typeof employeeNavigation)[number] | (typeof adminNavigationGroups)[number]["items"][number];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href, item.match);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "w-full" : "h-9",
        active
          ? "translate-y-[1px] scale-[0.99] bg-primary text-primary-foreground shadow-[inset_0_2px_4px_rgb(0_0_0_/_0.2)]"
          : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground active:translate-y-[1px] active:scale-[0.99] active:bg-accent",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {item.title}
    </Link>
  );
}

export function EmployeeNavigation({
  compact,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Employee navigation" className={cn(compact ? "grid gap-1" : "flex items-center gap-1")}>
      {employeeNavigation.map((item) => (
        <NavigationLink
          key={item.href}
          item={item}
          compact={compact}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function AdminNavigation({
  compact = true,
  onNavigate,
  role,
}: {
  compact?: boolean;
  onNavigate?: () => void;
  role?: string | null;
}) {
  const navigationGroups = getAdminNavigationGroups(role);

  return (
    <nav aria-label="Admin navigation" className="grid gap-4">
      {navigationGroups.map((group) => (
        <div key={group.title} className="grid gap-1">
          <p className="px-3 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className={cn(compact ? "grid gap-1" : "flex flex-wrap gap-1")}>
            {group.items.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                compact={compact}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
