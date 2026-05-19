import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { ProjectActivityItem } from "@/lib/queries/project-activity";
import {
  MessageSquare,
  Clock,
  Package,
  CheckCircle2,
} from "lucide-react";

const icons: Record<ProjectActivityItem["kind"], React.ComponentType<{ className?: string }>> = {
  deliverable_status: Package,
  deliverable_comment: MessageSquare,
  time_session: Clock,
  task_done: CheckCircle2,
};

export function ProjectActivityFeed({ items }: { items: ProjectActivityItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Ainda sem movimentação registrada neste projeto.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const Icon = icons[item.kind];
          return (
            <li key={item.id} className="flex gap-3 px-5 py-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                {item.detail && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {item.detail}
                  </p>
                )}
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                  {formatDateTime(item.at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
