import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

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
        <p className="truncate text-sm font-medium">
          {email ?? "Signed in"}
        </p>
        {role ? (
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        ) : null}
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut data-icon="inline-start" />
          Log out
        </Button>
      </form>
    </div>
  );
}
