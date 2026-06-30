"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      position="top-right"
      expand={false}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "border border-border/80 bg-popover text-popover-foreground shadow-lg shadow-primary/10 dark:border-border dark:bg-popover dark:text-popover-foreground",
          title: "font-semibold tracking-normal",
          description: "text-muted-foreground dark:text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          closeButton:
            "border-border bg-popover text-muted-foreground hover:text-foreground dark:bg-popover",
        },
      }}
    />
  );
}
