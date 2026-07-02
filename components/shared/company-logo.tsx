import Image from "next/image";

import { cn } from "@/lib/utils";

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
      className={cn("h-auto w-36 object-contain", className)}
    />
  );
}
