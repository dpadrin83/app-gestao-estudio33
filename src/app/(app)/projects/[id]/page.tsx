import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ProjectForm } from "@/components/forms/project-form";
import {
  getProject,
  listActiveClients,
} from "@/lib/actions/projects";
import {
  listActivitiesByProject,
  listScheduleTemplates,
} from "@/lib/actions/activities";
import { listDeliverablesByProject } from "@/lib/actions/deliverables";
import {
  getProjectFinanceSummary,
  listProjectCosts,
} from "@/lib/actions/finance";
import { listProjectFinanceDocuments } from "@/lib/actions/project-finance-documents";
import { getMarginAlertPercent } from "@/lib/actions/settings";
import { getActiveSession, listSessions } from "@/lib/actions/sessions";
import { listTasksByProject } from "@/lib/actions/tasks";
import { getProjectActivityFeed } from "@/lib/queries/project-activity";
import { listProjectLinks } from "@/lib/actions/project-links";
import { ProjectLinks } from "../project-links";
import { ProjectActivityFeed } from "../project-activity-feed";
import { ProjectSchedule } from "../project-schedule";
import { ProjectTasksKanban } from "../project-tasks-kanban";
import { ProjectDeliverables } from "../project-deliverables";
import { ProjectDeliverablePlan } from "@/components/projects/project-deliverable-plan";
import { getDeliverablePlan } from "@/lib/actions/deliverable-plan";
import { getCatalogStructure } from "@/lib/actions/deliverable-catalog";
import { listStudioProfessionals } from "@/lib/actions/project-macro-plan";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { isInternalProjectsClient } from "@/lib/projects/internal-client";
import { serviceLineLabels } from "@/lib/format";
import { ProjectFinance } from "../project-finance";
import { SessionsList } from "../sessions-list";
import { ProjectRowTimer } from "../project-row-timer";
import {
  formatDate,
  formatCurrency,
  formatDuration,
  durationBetween,
  paymentStatusLabels,
} from "@/lib/format";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  const [
    clients,
    sessions,
    activeSession,
    activities,
    templates,
    deliverables,
    costs,
    finance,
    tasks,
    activityFeed,
    projectLinks,
    deliverablePlan,
    catalogStructure,
    studioProfessionals,
    financeDocuments,
    marginAlertPercent,
  ] = await Promise.all([
    listActiveClients(),
    listSessions(id),
    getActiveSession(),
    listActivitiesByProject(id),
    listScheduleTemplates(),
    listDeliverablesByProject(id),
    listProjectCosts(id),
    getProjectFinanceSummary(id, project.contract_value),
    listTasksByProject(id),
    getProjectActivityFeed(id),
    listProjectLinks(id),
    getDeliverablePlan(id),
    getCatalogStructure(),
    listStudioProfessionals(),
    listProjectFinanceDocuments(id),
    getMarginAlertPercent(),
  ]);

  const totalMs = sessions.reduce((acc, s) => {
    if (!s.ended_at) return acc; // ignora sessão aberta no total fechado
    return acc + durationBetween(s.started_at, s.ended_at);
  }, 0);

  // Garante que o cliente atual aparece como opção mesmo se inativo
  const clientOptions = [...clients];
  if (project.client && !clients.some((c) => c.id === project.client_id)) {
    clientOptions.unshift({ id: project.client_id, name: project.client.name });
  }

  return (
    <>
      <PageHeader
        eyebrow={`Projetos · ${project.client?.name ?? ""}`}
        title={project.name}
        description={`Criado em ${formatDate(project.created_at)}.`}
        action={
          <div className="flex items-center gap-2">
            <ProjectRowTimer
              projectId={project.id}
              isActiveForThis={activeSession?.project_id === project.id}
            />
            <Link
              href="/projects"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Voltar
            </Link>
            <ProjectDeleteButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <div className="mt-2">
            <ProjectStatusBadge status={project.status} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Horas registradas
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatDuration(totalMs)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Valor de contrato
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatCurrency(project.contract_value)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Pagamento
          </p>
          <p className="mt-1 text-sm font-semibold capitalize">
            {paymentStatusLabels[project.payment_status]}
          </p>
        </Card>
      </div>

      {isInternalProjectsClient(project.client?.name) && (
        <p className="mb-4 rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-3 py-2 text-sm text-muted-foreground">
          Projeto em modo rápido — em{" "}
          <a href="#dados" className="font-medium text-brand-orange hover:underline">
            Dados do projeto
          </a>{" "}
          escolha o cliente real quando quiser.
        </p>
      )}

      {project.service_line && (
        <p className="mb-6 text-sm text-muted-foreground">
          Área:{" "}
          <span className="font-medium text-foreground">
            {serviceLineLabels[project.service_line]}
          </span>
        </p>
      )}

      <ProjectTabs />

      <h2
        id="dados"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Dados do projeto
      </h2>
      <div className="mb-10 rounded-2xl border border-border bg-card/50 p-6">
        <ProjectForm initial={project} clientOptions={clientOptions} />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Remover o projeto apaga cronograma, entregáveis, acessos e horas
            vinculadas.
          </p>
          <ProjectDeleteButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <h2
        id="cronograma"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Cronograma
      </h2>
      <div className="mb-10">
        <ProjectSchedule
          projectId={project.id}
          activities={activities}
          tasks={tasks}
          templates={templates}
          aiConfigured={false}
        />
      </div>

      <h2
        id="plano-entregaveis"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Plano de entregáveis
      </h2>
      <div className="mb-10">
        <ProjectDeliverablePlan
          projectId={project.id}
          items={deliverablePlan}
          professionals={studioProfessionals}
          catalogGroups={catalogStructure.groups}
          hasScheduleActivities={activities.length > 0}
          projectLinks={projectLinks}
        />
      </div>

      <h2
        id="tarefas"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Tarefas
      </h2>
      <div className="mb-10">
        <ProjectTasksKanban
          projectId={project.id}
          tasks={tasks}
          activities={activities}
        />
      </div>

      <h2
        id="entregaveis"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Entregáveis
      </h2>
      <div className="mb-10">
        <ProjectDeliverables
          projectId={project.id}
          deliverables={deliverables}
          activities={activities}
        />
      </div>

      <h2
        id="financeiro"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Financeiro
      </h2>
      <div className="mb-10">
        <ProjectFinance
          projectId={project.id}
          costs={costs}
          summary={finance}
          paymentStatus={project.payment_status}
          invoicedAt={project.invoiced_at}
          receivedAt={project.received_at}
          marginAlertPercent={marginAlertPercent}
          documents={financeDocuments}
        />
      </div>

      <h2
        id="links"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Acessos e credenciais
      </h2>
      <div className="mb-10">
        <ProjectLinks projectId={project.id} links={projectLinks} />
      </div>

      <h2
        id="atividade"
        className="mb-3 text-xl font-semibold tracking-tight scroll-mt-24"
      >
        Atividade recente
      </h2>
      <div className="mb-10">
        <ProjectActivityFeed items={activityFeed} />
      </div>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">
        Sessões de horas
      </h2>
      <SessionsList sessions={sessions} projectId={project.id} />
    </>
  );
}
