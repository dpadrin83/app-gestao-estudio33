import Link from "next/link";
import { listActiveClients, listProjects } from "@/lib/actions/projects";
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
import { Plus } from "lucide-react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ProjectFilters } from "./project-filters";
import { ProjectRowTimer } from "./project-row-timer";
import { formatDateShort, formatCurrency } from "@/lib/format";
import type { ProjectStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { getActiveSession } from "@/lib/actions/sessions";

const ALL_STATUS: ProjectStatus[] = ["in_progress", "paused", "done", "archived"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status
    ? (params.status.split(",").filter(Boolean) as ProjectStatus[])
    : (["in_progress", "paused"] as ProjectStatus[]);
  const clientFilter = params.client && params.client !== "all" ? params.client : undefined;

  const [projects, clients, activeSession] = await Promise.all([
    listProjects({ status: statusFilter, clientId: clientFilter }),
    listActiveClients(),
    getActiveSession(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Projetos"
        title="Projetos"
        description="Cada projeto é vinculado a um cliente. Inicie/pare o timer direto na lista."
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
              Ajuste os filtros ou crie um projeto novo.
            </p>
            <Link
              href="/projects/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              <Plus className="size-4" />
              Criar projeto
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
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
                      className="hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.client?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.start_date ? formatDateShort(p.start_date) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.expected_end_date ? formatDateShort(p.expected_end_date) : "—"}
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
