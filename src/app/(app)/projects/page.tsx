import Link from "next/link";
import { listActiveClients } from "@/lib/actions/projects";
import { listProjectsEnriched } from "@/lib/queries/projects-list";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, AlertTriangle } from "lucide-react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import {
  ProjectFilters,
  type ProjectViewPreset,
} from "./project-filters";
import { ProjectRowTimer } from "./project-row-timer";
import { formatDateShort, formatCurrency } from "@/lib/format";
import type { ProjectStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { getActiveSession } from "@/lib/actions/sessions";

const ALL_STATUS: ProjectStatus[] = ["in_progress", "paused", "done", "archived"];

function resolveView(
  viewParam: string | undefined,
  statusParam: string | undefined,
  riskParam: string | undefined,
): {
  view: ProjectViewPreset;
  status: ProjectStatus[];
  atRiskOnly: boolean;
} {
  if (viewParam === "risco" || riskParam === "1") {
    return {
      view: "risco",
      status: ["in_progress"],
      atRiskOnly: true,
    };
  }
  if (viewParam === "concluidos") {
    return {
      view: "concluidos",
      status: ["done"],
      atRiskOnly: false,
    };
  }
  if (viewParam === "todos") {
    return { view: "todos", status: ALL_STATUS, atRiskOnly: false };
  }
  if (viewParam === "ativos") {
    return {
      view: "ativos",
      status: ["in_progress", "paused"],
      atRiskOnly: false,
    };
  }

  const statusFilter = statusParam
    ? (statusParam.split(",").filter(Boolean) as ProjectStatus[])
    : (["in_progress", "paused"] as ProjectStatus[]);

  return {
    view: "ativos",
    status: statusFilter,
    atRiskOnly: false,
  };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    client?: string;
    view?: string;
    risk?: string;
  }>;
}) {
  const params = await searchParams;
  const { view, status: statusFilter, atRiskOnly } = resolveView(
    params.view,
    params.status,
    params.risk,
  );
  const clientFilter = params.client && params.client !== "all" ? params.client : undefined;

  const [projects, clients, activeSession] = await Promise.all([
    listProjectsEnriched({
      status: statusFilter,
      clientId: clientFilter,
      atRiskOnly,
    }),
    listActiveClients(),
    getActiveSession(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Projetos"
        title="Projetos"
        description="Views rápidas, progresso do cronograma e timer na lista."
        action={
          <Link href="/projects/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Novo projeto
          </Link>
        }
      />

      <ProjectFilters
        initialStatus={statusFilter}
        initialClient={clientFilter ?? "all"}
        initialView={view}
        allStatus={ALL_STATUS}
        clientOptions={clients}
      />

      <Card className="overflow-hidden">
        {projects.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Nada por aqui
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {atRiskOnly
                ? "Nenhum projeto em risco no momento — ótimo sinal."
                : "Ajuste os filtros ou crie um projeto novo."}
            </p>
            {!atRiskOnly && (
              <Link
                href="/projects/new"
                className={cn(buttonVariants(), "mt-4 inline-flex")}
              >
                <Plus className="size-4" />
                Criar projeto
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término previsto</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <ProjectRowTimer
                      projectId={p.id}
                      isActiveForThis={activeSession?.project_id === p.id}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${p.id}`}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      {p.atRisk && (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-warning"
                          aria-label="Em risco"
                        />
                      )}
                      {p.name}
                    </Link>
                    {p.pendingDeliverables > 0 && (
                      <p className="mt-0.5 text-[10px] text-brand-yellow">
                        {p.pendingDeliverables} aguardando cliente
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.client?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    {p.progressPercent != null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-brand-purple"
                            style={{ width: `${p.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.progressPercent}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.start_date ? formatDateShort(p.start_date) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.expected_end_date
                      ? formatDateShort(p.expected_end_date)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(p.contract_value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
