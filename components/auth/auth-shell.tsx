import type { ReactNode } from "react";
import Link from "next/link";

import { appConfig } from "@/config/app";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-10">
      <div className="grid w-full max-w-md gap-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex rounded-sm text-2xl font-semibold tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {appConfig.name}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            {appConfig.companyName || "Internal company facilities"}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
