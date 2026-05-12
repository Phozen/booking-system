"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  const currentTheme = theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  const Icon = nextTheme === "dark" ? Moon : Sun;
  const label =
    nextTheme === "dark" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={cn(
        "border-border/80 bg-card/90 text-foreground hover:border-primary/40 hover:bg-accent",
        compact ? "size-10" : "min-h-10 gap-2 px-3.5",
        className,
      )}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className={cn(compact ? "sr-only" : "text-sm")}>
        {nextTheme === "dark" ? "Dark mode" : "Light mode"}
      </span>
    </Button>
  );
}
