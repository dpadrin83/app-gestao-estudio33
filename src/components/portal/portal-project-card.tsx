import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { PortalPhaseStepper } from "@/components/portal/portal-phase-stepper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { PortalProjectListItem } from "@/lib/actions/portal";
import { Calendar, Clock } from "lucide-react";

export function PortalProjectCard({ project }: { project: PortalProjectListItem }) {
  return (
    <Card className="overflow-hidden border-border/80 bg-card/50 transition hover:border-brand-purple/40">
      <Link href={`/portal/projects/${project.id}`} className="block p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">{project.name}</p>
            <p className="mt-1 text-sm font-medium text-brand-orange capitalize">
              Fase: {project.phase.currentPhaseLabel}
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="mt-4">
          <PortalPhaseStepper
            steps={project.phase.steps}
            progressPercent={project.phase.progressPercent}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-xs">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Tempo de produção
              </p>
              <p className="mt-0.5 font-medium text-foreground">
                {project.production.productionLabel}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
              project.production.isOverdue
                ? "border-destructive/40 bg-destructive/10"
                : "border-border/80 bg-muted/20",
            )}
          >
            <Calendar className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Previsão
              </p>
              <p
                className={cn(
                  "mt-0.5 font-medium",
                  project.production.isOverdue
                    ? "text-destructive"
                    : "text-foreground",
                )}
              >
                {project.production.deliveryLabel}
              </p>
              {project.expected_end_date && (
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {formatDate(project.expected_end_date)}
                </p>
              )}
            </div>
          </div>
        </div>

        {project.phase.nextMilestoneName && (
          <p className="mt-3 text-xs text-muted-foreground">
            Próximo marco:{" "}
            <span className="font-medium text-foreground">
              {project.phase.nextMilestoneName}
            </span>
          </p>
        )}

        <span
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "mt-4 inline-flex h-auto p-0 text-brand-orange",
          )}
        >
          Ver cronograma e entregáveis →
        </span>
      </Link>
    </Card>
  );
}
