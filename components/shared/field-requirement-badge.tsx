export function FieldRequirementBadge({ required }: { required: boolean }) {
  return (
    <span
      className={
        required
          ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive"
          : "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
      }
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}
