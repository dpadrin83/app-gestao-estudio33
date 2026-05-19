import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { PHASE_ORDER } from "@/lib/project-phase";
import type { PortalProjectListItem } from "@/lib/actions/portal";
import { ArrowRight, Calendar, Clock } from "lucide-react";

export function PortalProductionTile({
  project,
}: {
  project: PortalProjectListItem;
}) {
  const currentIndex = project.phase.currentPhase
    ? PHASE_ORDER.indexOf(project.phase.currentPhase)
    : 0;

  return (
    <Link href={`/portal/projects/${project.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden border-border/80 bg-card/60 transition hover:border-brand-purple/50 hover:shadow-lg hover:shadow-brand-purple/5">
        <div className="border-b border-border bg-gradient-to-br from-brand-orange/10 via-transparent to-brand-purple/5 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold group-hover:text-brand-orange">
                {project.name}
              </h3>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                Fase atual:{" "}
                <span className="font-medium text-foreground">
                  {project.phase.currentPhaseLabel}
                </span>
              </p>
            </div>
            <div
              className="relative flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-brand-orange/40 bg-background"
              aria-hidden
            >
              <span className="font-mono text-sm font-bold text-brand-orange">
                {project.phase.progressPercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex justify-between gap-1">
            {PHASE_ORDER.map((phase, i) => (
              <div key={phase} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full",
                    i < currentIndex && "bg-success",
                    i === currentIndex && "bg-brand-orange",
                    i > currentIndex && "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "hidden text-center font-mono text-[8px] uppercase leading-tight sm:block",
                    i === currentIndex
                      ? "font-semibold text-brand-orange"
                      : "text-muted-foreground",
                  )}
                >
                  {phase.slice(0, 4)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto grid gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>{project.production.productionLabel}</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                project.production.isOverdue
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              <Calendar className="size-3.5 shrink-0" />
              <span>
                {project.production.deliveryLabel}
                {project.expected_end_date &&
                  ` · ${formatDate(project.expected_end_date)}`}
              </span>
            </div>
          </div>

          {project.phase.nextMilestoneName && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Próximo:{" "}
              <span className="font-medium text-foreground">
                {project.phase.nextMilestoneName}
              </span>
            </p>
          )}

          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange">
            Ver detalhes
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
