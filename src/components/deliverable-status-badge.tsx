import { cn } from "@/lib/utils";
import type { DeliverableStatus } from "@/types/database";
import { deliverableStatusLabels } from "@/lib/format";

const map: Record<DeliverableStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  internal_review: "bg-brand-blue/15 text-[#93C5FD] border-brand-blue/30",
  sent_to_client: "bg-brand-orange/15 text-[#FDBA74] border-brand-orange/30",
  approved: "bg-success/15 text-[#86EFAC] border-success/40",
  rejected: "bg-destructive/15 text-[#FCA5A5] border-destructive/40",
};

export function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
        map[status],
      )}
    >
      {deliverableStatusLabels[status]}
    </span>
  );
}
