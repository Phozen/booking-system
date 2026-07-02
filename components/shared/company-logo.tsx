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
      className={cn("h-auto w-28 object-contain", className)}
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
          "text-lg font-semibold tracking-normal text-foreground",
          textClassName,
        )}
      >
        {productName}
      </span>
    </span>
  );
}
