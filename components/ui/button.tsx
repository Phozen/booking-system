import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap shadow-xs shadow-foreground/10 transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:shadow-black/25 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/35 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary/80 bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90",
        outline:
          "border-input bg-card text-foreground shadow-foreground/10 hover:border-primary/45 hover:bg-accent hover:text-accent-foreground aria-expanded:border-primary/45 aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:border-input dark:bg-card dark:hover:bg-input/55",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-primary/35 hover:bg-secondary/85 aria-expanded:border-primary/35 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-border/70 bg-background/70 text-foreground shadow-none hover:border-primary/35 hover:bg-accent/80 hover:text-accent-foreground aria-expanded:border-primary/35 aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:bg-muted/20 dark:hover:bg-muted/55",
        destructive:
          "border-destructive/80 bg-destructive text-destructive-foreground shadow-destructive/20 hover:bg-destructive/90 focus-visible:border-destructive/40 focus-visible:ring-destructive/25 dark:focus-visible:ring-destructive/40",
        success:
          "border-emerald-700/70 bg-emerald-600 text-white shadow-emerald-700/20 hover:bg-emerald-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/25 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400",
        warning:
          "border-amber-600/70 bg-amber-500 text-amber-950 shadow-amber-700/20 hover:bg-amber-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/25 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300",
        link:
          "border-transparent bg-transparent text-primary underline underline-offset-4 shadow-none hover:bg-transparent hover:text-primary/85",
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
