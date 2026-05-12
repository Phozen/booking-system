import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function UserMenu({
  email,
  role,
  className,
}: {
  email?: string | null;
  role?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="min-w-0 max-w-44">
        <p className="truncate text-sm font-medium" title={email ?? "Signed in"}>
          {email ?? "Signed in"}
        </p>
        {role ? (
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/profile"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <UserRound data-icon="inline-start" />
          Profile
        </Link>
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
