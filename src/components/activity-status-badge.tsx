import { cn } from "@/lib/utils";
import type { ActivityStatus } from "@/types/database";
import { activityStatusLabels } from "@/lib/format";

const map: Record<ActivityStatus, string> = {
  not_started: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-brand-purple/20 text-[#BFA9F5] border-brand-purple/40",
  completed: "bg-success/15 text-[#86EFAC] border-success/40",
  delayed: "bg-destructive/15 text-[#FCA5A5] border-destructive/40",
};

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
        map[status],
      )}
    >
      <span aria-hidden>●</span>
      {activityStatusLabels[status]}
    </span>
  );
}
