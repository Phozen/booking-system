import type { ReactNode } from "react";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function PendingButtonContent({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  if (!pending) {
    return <>{children}</>;
  }

  return (
    <>
      <LoadingSpinner size="sm" label={pendingLabel} />
      <span>{pendingLabel}</span>
    </>
  );
}
