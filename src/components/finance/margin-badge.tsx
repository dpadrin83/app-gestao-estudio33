import { cn } from "@/lib/utils";

export function MarginBadge({
  percent,
  atRisk,
}: {
  percent: number | null;
  atRisk?: boolean;
}) {
  if (percent == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold",
        percent < 0
          ? "text-destructive"
          : atRisk
            ? "text-warning"
            : "text-success",
      )}
    >
      {percent}%
    </span>
  );
}
