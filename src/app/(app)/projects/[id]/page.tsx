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
import { getActiveSession, listSessions } from "@/lib/actions/sessions";
import { SessionsList } from "../sessions-list";
import { ProjectRowTimer } from "../project-row-timer";
import {
  formatDate,
  formatCurrency,
  formatDuration,
  durationBetween,
} from "@/lib/format";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  const [clients, sessions, activeSession] = await Promise.all([
    listActiveClients(),
    listSessions(id),
    getActiveSession(),
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
          </div>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
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
      </div>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Dados do projeto</h2>
      <div className="mb-10 rounded-2xl border border-border bg-card/50 p-6">
        <ProjectForm initial={project} clientOptions={clientOptions} />
      </div>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">
        Sessões de horas
      </h2>
      <SessionsList sessions={sessions} projectId={project.id} />
    </>
  );
}
