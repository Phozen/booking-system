import Image from "next/image";

import { cn } from "@/lib/utils";

export const productName = "QBook";

export function CompanyLogo({
  className,
  priority = false,
  sizes = "(max-width: 640px) 96px, 128px",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src="/company-logo.png"
      alt="Qhazanah"
      width={512}
      height={300}
      priority={priority}
      sizes={sizes}
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
  sizes,
}: {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <CompanyLogo className={logoClassName} priority={priority} sizes={sizes} />
      <span
        className={cn(
          "qbook-wordmark inline-block pb-0.5 text-xl font-bold leading-none tracking-tight text-foreground",
          textClassName,
        )}
      >
        {productName}
      </span>
    </span>
  );
}
