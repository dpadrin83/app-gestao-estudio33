import { cn } from "@/lib/utils";
import { activityStatusLabels } from "@/lib/format";
import type { ActivityStatus } from "@/types/database";

const pillClass: Record<ActivityStatus, string> = {
  not_started: "bg-white/6 text-muted-foreground",
  in_progress: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  delayed: "bg-destructive/20 text-destructive",
};

export function ActivityStatusPill({
  status,
  label,
  className,
}: {
  status: ActivityStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide",
        pillClass[status],
        className,
      )}
    >
      {label ?? activityStatusLabels[status]}
    </span>
  );
}
