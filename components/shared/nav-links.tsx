"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  adminNavigationGroups,
  employeeNavigation,
  getAdminNavigationGroups,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import { employeeFeatureStyles } from "@/components/shared/employee-feature-styles";

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
  const featureStyle = "tone" in item ? employeeFeatureStyles[item.tone] : null;
  const tone = featureStyle?.nav ?? null;
  const activeTone = featureStyle?.navActive ?? null;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-md border shadow-xs shadow-foreground/5 transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-black/25",
        tone
          ? "px-4 py-2.5 text-base font-bold"
          : "px-3 py-2 text-sm font-medium",
        compact ? "w-full" : tone ? "h-11" : "h-9",
        tone &&
          "border shadow-md active:translate-y-0.5 active:scale-[0.99] active:brightness-90 active:shadow-[inset_0_2px_6px_rgb(0_0_0_/_0.34)]",
        active && activeTone
          ? `${activeTone} translate-y-0.5 scale-[0.99]`
          : active
          ? "translate-y-0.5 scale-[0.99] border-primary/90 bg-primary text-primary-foreground shadow-[inset_0_2px_6px_rgb(0_0_0_/_0.3)]"
          : tone
            ? `${tone} opacity-90 hover:opacity-100`
          : "border-border/75 bg-card/85 text-foreground hover:border-primary/35 hover:bg-accent/70 hover:text-accent-foreground",
      )}
    >
      <Icon className={tone ? "size-5" : "size-4"} aria-hidden="true" />
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
