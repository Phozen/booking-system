import Link from "next/link";
import { ArrowLeftRight, Bell, LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { formatAppRole, isAdminRole } from "@/lib/auth/profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function UserMenu({
  email,
  role,
  className,
  showIdentity = true,
  currentArea = "employee",
  profileHref,
  showModeSwitch = true,
}: {
  email?: string | null;
  role?: string | null;
  className?: string;
  showIdentity?: boolean;
  currentArea?: "employee" | "admin";
  profileHref?: "/profile" | "/admin/profile";
  showModeSwitch?: boolean;
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
        <div className="min-w-0 max-w-44">
          <p
            className="truncate text-sm font-medium"
            title={email ?? "Signed in"}
          >
            {email ?? "Signed in"}
          </p>
          {role ? (
            <p className="text-xs text-muted-foreground">{formatAppRole(role)}</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {adminRole && showModeSwitch ? (
          <Link
            href={switchHref}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeftRight data-icon="inline-start" />
            {switchLabel}
          </Link>
        ) : null}
        <Link
          href={resolvedProfileHref}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Profile"
          title="Profile"
        >
          <UserRound aria-hidden="true" />
        </Link>
        {currentArea === "employee" ? (
          <Link
            href="/notification-preferences"
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Notification preferences"
            title="Notification preferences"
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
      </div>
      <ThemeToggle compact />
    </div>
  );
}
