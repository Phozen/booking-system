import Link from "next/link";
import { ArrowLeftRight, LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { formatAppRole, isAdminRole } from "@/lib/auth/profile";
import type {
  AppNotification,
  AppNotificationType,
} from "@/lib/notifications/app-notifications";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const ADMIN_NOTIFICATION_TYPES: AppNotificationType[] = [
  "booking_approval_request",
];

export function UserMenu({
  email,
  role,
  className,
  controlsClassName,
  showIdentity = true,
  currentArea = "employee",
  profileHref,
  notifications = [],
  unseenNotificationCount = 0,
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
  notifications?: AppNotification[];
  unseenNotificationCount?: number;
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
      {adminRole && showModeSwitch ? (
        <Link
          href={switchHref}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full xl:w-auto",
          )}
          onClick={onNavigate}
        >
          <ArrowLeftRight data-icon="inline-start" />
          {switchLabel}
        </Link>
      ) : null}
      <div
        className={cn(
          "flex flex-row flex-wrap items-center gap-2 sm:justify-end",
          controlsClassName,
        )}
      >
        <Link
          href={resolvedProfileHref}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Profile"
          onClick={onNavigate}
        >
          <UserRound aria-hidden="true" />
        </Link>
        <NotificationPopover
          notifications={notifications}
          unseenCount={unseenNotificationCount}
          markSeenTypes={
            currentArea === "admin" ? ADMIN_NOTIFICATION_TYPES : undefined
          }
          onNavigate={onNavigate}
        />
        <form action={logoutAction} className="inline-flex">
          <Button type="submit" variant="outline">
            <LogOut data-icon="inline-start" />
            Log out
          </Button>
        </form>
        <ThemeToggle compact />
      </div>
    </div>
  );
}
