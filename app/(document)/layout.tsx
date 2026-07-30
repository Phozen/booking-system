import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/guards";
import { SkipLink } from "@/components/shared/skip-link";

export const dynamic = "force-dynamic";

/** Minimal shell for printable approval forms — no employee content card. */
export default async function DocumentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <div className="qbook-office-surface flex min-h-svh flex-col">
      <SkipLink />
      <div id="main-content" tabIndex={-1} className="qbook-document-mode flex-1">
        {children}
      </div>
    </div>
  );
}
