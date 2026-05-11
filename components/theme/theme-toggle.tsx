"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const themeOptions = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
] as const;

export function ThemeToggle({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const currentTheme = theme ?? "system";

  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend
        className={cn(
          "text-xs font-medium uppercase tracking-wide text-muted-foreground",
          compact && "sr-only",
        )}
      >
        Theme
      </legend>
      <div
        className={cn(
          "grid grid-cols-3 gap-1 rounded-lg border border-border/70 bg-muted/45 p-1",
          compact && "min-w-32",
        )}
        role="radiogroup"
        aria-label="Theme preference"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const selected = currentTheme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                "hover:bg-background hover:text-foreground",
                selected &&
                  "bg-background text-foreground shadow-sm ring-1 ring-border",
              )}
              onClick={() => setTheme(option.value)}
              aria-label={`Use ${option.label.toLowerCase()} theme`}
              title={`${option.label} theme`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className={cn(compact && "sr-only")}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
