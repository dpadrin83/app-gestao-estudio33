import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database";

const map: Record<ProjectStatus, { label: string; classes: string }> = {
  in_progress: {
    label: "em produção",
    classes:
      "bg-brand-purple/20 text-[#BFA9F5] border-brand-purple/40",
  },
  paused: {
    label: "pausado",
    classes: "bg-warning/15 text-[#FCD34D] border-warning/40",
  },
  done: {
    label: "concluído",
    classes: "bg-success/15 text-[#86EFAC] border-success/40",
  },
  archived: {
    label: "arquivado",
    classes: "bg-muted text-muted-foreground border-border",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const v = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
        v.classes,
      )}
    >
      <span aria-hidden>●</span>
      {v.label}
    </span>
  );
}
