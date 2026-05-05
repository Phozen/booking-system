import { ImageIcon } from "lucide-react";

import type { Facility } from "@/lib/facilities/queries";
import { cn } from "@/lib/utils";

export function FacilityPhoto({
  facility,
  className,
  priority = false,
}: {
  facility: Pick<Facility, "name" | "level" | "photos">;
  className?: string;
  priority?: boolean;
}) {
  const photo = facility.photos[0];

  if (photo?.publicUrl) {
    return (
      <div
        role="img"
        aria-label={photo.altText ?? `${facility.name}, ${facility.level}`}
        data-priority={priority ? "true" : undefined}
        className={cn("h-full w-full object-cover", className)}
        style={{
          backgroundImage: `url(${photo.publicUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
    );
  }

  return (
    <div
      role="img"
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
      aria-label={`${facility.name} photo placeholder`}
    >
      <ImageIcon className="size-8" aria-hidden="true" />
    </div>
  );
}
