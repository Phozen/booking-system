import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";

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
      <div className="min-w-0">
        <p className="break-all text-sm font-medium">
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
    </div>
  );
}
