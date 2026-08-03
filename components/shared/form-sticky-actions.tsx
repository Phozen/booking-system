import type { ReactNode } from "react";

export function FormStickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="qbook-sticky-actions">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
    </div>
  );
}
