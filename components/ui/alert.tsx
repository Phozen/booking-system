import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-border/70 bg-card text-card-foreground shadow-sm *:[svg]:text-primary",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-950 shadow-sm *:data-[slot=alert-description]:text-rose-800 *:[svg]:text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100 dark:*:data-[slot=alert-description]:text-rose-200",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm *:data-[slot=alert-description]:text-emerald-800 *:[svg]:text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100 dark:*:data-[slot=alert-description]:text-emerald-200",
        warning:
          "border-amber-200 bg-amber-50 text-amber-950 shadow-sm *:data-[slot=alert-description]:text-amber-900 *:[svg]:text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 dark:*:data-[slot=alert-description]:text-amber-200",
        info:
          "border-sky-200 bg-sky-50 text-sky-950 shadow-sm *:data-[slot=alert-description]:text-sky-800 *:[svg]:text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100 dark:*:data-[slot=alert-description]:text-sky-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
