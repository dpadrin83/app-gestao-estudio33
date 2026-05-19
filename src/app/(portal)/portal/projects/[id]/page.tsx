import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { PortalPhaseStepper } from "@/components/portal/portal-phase-stepper";
import { getPortalProject } from "@/lib/actions/portal";
import { computeProductionTime } from "@/lib/portal/production-time";
import { PortalProjectView } from "./portal-project-view";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Clock, Calendar } from "lucide-react";

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, phase, milestones, visibleActivities, deliverables } =
    await getPortalProject(id);
  if (!project) return notFound();

  const production = computeProductionTime(
    project.start_date,
    project.expected_end_date,
    project.status,
  );

  return (
    <>
      <PageHeader
        eyebrow="Projeto"
        title={project.name}
        description={`Fase atual: ${phase.currentPhaseLabel}`}
        action={
          <Link href="/portal" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Voltar
          </Link>
        }
      />
      <div className="mb-8 space-y-4">
        <ProjectStatusBadge status={project.status} />
        <PortalPhaseStepper
          steps={phase.steps}
          progressPercent={phase.progressPercent}
        />
        {phase.nextMilestoneName && (
          <p className="text-sm text-muted-foreground">
            Próximo marco:{" "}
            <span className="font-medium text-foreground">
              {phase.nextMilestoneName}
            </span>
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-4 py-3 text-sm">
            <Clock className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                Tempo de produção
              </p>
              <p className="font-medium">{production.productionLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-4 py-3 text-sm">
            <Calendar className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                Previsão
              </p>
              <p className="font-medium">{production.deliveryLabel}</p>
              {project.expected_end_date && (
                <p className="font-mono text-xs text-muted-foreground">
                  {formatDate(project.expected_end_date)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <PortalProjectView
        projectId={project.id}
        milestones={milestones}
        visibleActivities={visibleActivities}
        deliverables={deliverables}
      />
    </>
  );
}
