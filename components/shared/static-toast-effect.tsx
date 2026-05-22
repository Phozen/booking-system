"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function StaticToastEffect({
  type = "success",
  title,
  description,
}: {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) {
      return;
    }

    shown.current = true;
    toast[type](title, {
      description,
      duration: type === "error" ? 8000 : 5000,
    });
  }, [description, title, type]);

  return null;
}
