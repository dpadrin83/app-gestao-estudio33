import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/queries/stats";
import { getActiveSession } from "@/lib/actions/sessions";
import { formatDuration } from "@/lib/format";
import { Clock, Hourglass, FolderKanban, Activity } from "lucide-react";
import { ProjectRowTimer } from "../projects/project-row-timer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [stats, active] = await Promise.all([
    getDashboardStats(),
    getActiveSession(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Boa volta, Danilo."
        description={
          active
            ? `Timer rodando em "${active.project.name}".`
            : "Visão geral da operação."
        }
      />

      {/* sessão ativa em destaque */}
      {active && (
        <Card className="mb-6 border-success/40 bg-success/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-2 animate-pulse rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-success/80">
                  Sessão em curso
                </p>
                <p className="text-sm font-semibold">
                  <Link
                    href={`/projects/${active.project.id}`}
                    className="hover:underline"
                  >
                    {active.project.name}
                  </Link>
                </p>
              </div>
            </div>
            <ProjectRowTimer projectId={active.project.id} isActiveForThis />
          </div>
        </Card>
      )}

      {/* 3 cards de KPI */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Clock}
          label="Horas nesta semana"
          value={formatDuration(stats.totalMsWeek)}
          accent="brand-pink"
        />
        <KpiCard
          icon={Hourglass}
          label="Horas neste mês"
          value={formatDuration(stats.totalMsMonth)}
          accent="brand-orange"
        />
        <KpiCard
          icon={FolderKanban}
          label="Projetos em produção"
          value={String(stats.activeProjectsCount).padStart(2, "0")}
          accent="brand-purple"
        />
      </div>

      {/* Lista de projetos ativos com horas da semana */}
      <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Activity className="size-5 text-muted-foreground" />
        Projetos em produção
      </h2>

      <Card className="overflow-hidden">
        {stats.perProjectThisWeek.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Sem projetos em produção no momento.
            </p>
            <Link
              href="/projects/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              Criar projeto
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.perProjectThisWeek.map((p) => (
              <li
                key={p.projectId}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/projects/${p.projectId}`}
                    className="font-medium hover:underline"
                  >
                    {p.projectName}
                  </Link>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.clientName}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {formatDuration(p.totalMs)}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      esta semana
                    </p>
                  </div>
                  <ProjectRowTimer
                    projectId={p.projectId}
                    isActiveForThis={active?.project.id === p.projectId}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "brand-pink" | "brand-orange" | "brand-purple";
}) {
  const ring: Record<typeof accent, string> = {
    "brand-pink": "ring-brand-pink/30 bg-brand-pink/10 text-brand-pink",
    "brand-orange": "ring-brand-orange/30 bg-brand-orange/10 text-brand-orange",
    "brand-purple": "ring-brand-purple/30 bg-brand-purple/10 text-brand-purple",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className={cn("flex size-7 items-center justify-center rounded-md ring-1", ring[accent])}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <p className="mt-3 font-mono text-3xl font-bold">{value}</p>
    </Card>
  );
}
