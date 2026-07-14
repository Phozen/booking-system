"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function OverlayLoader({
  show,
  label = "Loading...",
  className
}: {
  show: boolean;
  label?: string;
  className?: string;
}) {
  const [render, setRender] = useState(show);
  
  useEffect(() => {
    const timeout = setTimeout(
      () => setRender(show),
      show ? 0 : 300,
    );

    return () => clearTimeout(timeout);
  }, [show]);

  if (!render) return null;
  
  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm duration-300 fill-mode-both",
        show ? "animate-in fade-in zoom-in-95" : "animate-out fade-out zoom-out-95",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="size-10 animate-spin" aria-hidden="true" />
        <p className="text-lg font-semibold animate-pulse">{label}</p>
      </div>
    </div>
  );
}
