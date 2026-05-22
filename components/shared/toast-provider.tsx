"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      expand={false}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "border border-border/70 bg-card text-card-foreground shadow-lg shadow-primary/10",
          title: "font-semibold tracking-normal",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          closeButton:
            "border-border bg-card text-muted-foreground hover:text-foreground",
        },
      }}
    />
  );
}
