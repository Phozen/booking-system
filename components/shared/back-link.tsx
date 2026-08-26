import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Stronger outline so back links do not blend into the page background. */
export function backLinkClassName(className?: string) {
  return buttonVariants({
    variant: "outline",
    size: "sm",
    className: cn(
      "border-2 border-primary/55 bg-card font-semibold text-foreground shadow-sm shadow-foreground/10 hover:border-primary hover:bg-primary/10 hover:text-foreground",
      className,
    ),
  });
}

export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={backLinkClassName(className)}>
      <ArrowLeft data-icon="inline-start" aria-hidden="true" />
      {children}
    </Link>
  );
}
