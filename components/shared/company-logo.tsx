import Image from "next/image";

import { cn } from "@/lib/utils";

export const productName = "QBook";

export function CompanyLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/company-logo.png"
      alt="Qhazanah"
      width={512}
      height={300}
      priority={priority}
      className={cn(
        "h-auto w-28 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)] saturate-125 contrast-110",
        className,
      )}
    />
  );
}

export function CompanyBrand({
  className,
  logoClassName,
  textClassName,
  priority = false,
}: {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <CompanyLogo className={logoClassName} priority={priority} />
      <span
        className={cn(
          "qbook-wordmark bg-gradient-to-r from-emerald-700 via-foreground to-amber-600 bg-clip-text text-xl font-bold tracking-normal text-transparent dark:from-emerald-300 dark:via-white dark:to-amber-300",
          textClassName,
        )}
      >
        {productName}
      </span>
    </span>
  );
}
