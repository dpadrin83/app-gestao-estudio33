import { Badge } from "@/components/ui/badge";
import { clientStatusLabels } from "@/lib/format";
import type { ClientStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const styles: Record<ClientStatus, string> = {
  prospect: "border-brand-blue/40 bg-brand-blue/15 text-brand-blue",
  active: "border-success/40 bg-success/15 text-[#86EFAC]",
  paused: "border-brand-yellow/40 bg-brand-yellow/15 text-brand-yellow",
  closed: "border-muted-foreground/30 bg-muted/30 text-muted-foreground",
  inactive: "border-border text-muted-foreground",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase", styles[status])}>
      {clientStatusLabels[status]}
    </Badge>
  );
}
