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
  const label = photo?.altText ?? `${facility.name}, ${facility.level}`;

  if (photo?.publicUrl) {
    return (
      <img
        src={photo.publicUrl}
        alt={label}
        width={224}
        height={168}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        className={cn("h-full w-full object-cover", className)}
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
