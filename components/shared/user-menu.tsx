import Link from "next/link";
import { ArrowLeftRight, Bell, LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { formatAppRole, isAdminRole } from "@/lib/auth/profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export function UserMenu({
  email,
  role,
  className,
  controlsClassName,
  showIdentity = true,
  currentArea = "employee",
  profileHref,
  showModeSwitch = true,
  onNavigate,
}: {
  email?: string | null;
  role?: string | null;
  className?: string;
  controlsClassName?: string;
  showIdentity?: boolean;
  currentArea?: "employee" | "admin";
  profileHref?: "/profile" | "/admin/profile";
  showModeSwitch?: boolean;
  onNavigate?: () => void;
}) {
  const adminRole = isAdminRole(role);
  const resolvedProfileHref =
    profileHref ?? (currentArea === "admin" ? "/admin/profile" : "/profile");
  const switchHref = currentArea === "admin" ? "/dashboard" : "/admin/dashboard";
  const switchLabel =
    currentArea === "admin" ? "Employee side" : "Admin console";

  return (
    <div className={className}>
      {showIdentity ? (
        <div className="min-w-0">
          <p className="break-words text-sm font-medium leading-5 sm:truncate [overflow-wrap:anywhere]">
            {email ?? "Signed in"}
          </p>
          {role ? (
            <p className="text-xs text-muted-foreground">{formatAppRole(role)}</p>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end",
          controlsClassName,
        )}
      >
        {adminRole && showModeSwitch ? (
          <Link
            href={switchHref}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
            onClick={onNavigate}
          >
            <ArrowLeftRight data-icon="inline-start" />
            {switchLabel}
          </Link>
        ) : null}
        <Link
          href={resolvedProfileHref}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Profile"
          onClick={onNavigate}
        >
          <UserRound aria-hidden="true" />
        </Link>
        {currentArea === "employee" ? (
          <Link
            href="/notifications"
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Notifications"
            onClick={onNavigate}
          >
            <Bell aria-hidden="true" />
          </Link>
        ) : null}
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut data-icon="inline-start" />
            Log out
          </Button>
        </form>
        <ThemeToggle compact />
      </div>
    </div>
  );
}
