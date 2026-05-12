import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-1 ring-primary/10 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
        outline:
          "border-input bg-card/95 text-foreground shadow-xs hover:border-primary/40 hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:border-input dark:bg-input/35 dark:hover:bg-input/55",
        secondary:
          "border-border/80 bg-secondary text-secondary-foreground shadow-xs hover:border-primary/25 hover:bg-secondary/85 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:hover:bg-muted/55",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 ring-1 ring-destructive/10 hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/25 dark:focus-visible:ring-destructive/40",
        success:
          "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 ring-1 ring-emerald-500/15 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/25 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400",
        warning:
          "bg-amber-500 text-amber-950 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/15 hover:bg-amber-400 hover:shadow-md hover:shadow-amber-500/25 focus-visible:border-amber-500 focus-visible:ring-amber-500/25 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
