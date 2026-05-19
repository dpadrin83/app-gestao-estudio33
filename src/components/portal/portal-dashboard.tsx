import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PortalClientBrand } from "@/components/portal/portal-client-brand";
import { PortalProductionTile } from "@/components/portal/portal-production-tile";
import type { PortalDashboard } from "@/lib/actions/portal";
import { AlertCircle, FolderKanban, Percent, PauseCircle } from "lucide-react";

export function PortalDashboard({ data }: { data: PortalDashboard }) {
  const { summary, inProduction, paused, done } = data;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-border bg-gradient-to-br from-card/80 via-card/40 to-brand-purple/5 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <PortalClientBrand
            name={data.clientName}
            logoUrl={data.logoUrl}
            segment={data.segment}
          />
          <p className="max-w-sm text-sm text-muted-foreground lg:text-right">
            Visão geral dos projetos em andamento. Clique em um card para ver
            cronograma, prazos e entregáveis.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<FolderKanban className="size-4 text-brand-orange" />}
          label="Em produção"
          value={String(summary.inProductionCount)}
        />
        <KpiCard
          icon={<Percent className="size-4 text-brand-purple" />}
          label="Progresso médio"
          value={
            summary.inProductionCount > 0
              ? `${summary.avgProgressPercent}%`
              : "—"
          }
        />
        <KpiCard
          icon={<AlertCircle className="size-4 text-brand-yellow" />}
          label="Aguardando você"
          value={String(summary.pendingApprovals)}
          highlight={summary.pendingApprovals > 0}
        />
        <KpiCard
          icon={<PauseCircle className="size-4 text-muted-foreground" />}
          label="Pausados"
          value={String(summary.pausedCount)}
        />
      </div>

      {summary.pendingApprovals > 0 && (
        <Card className="border-brand-yellow/40 bg-brand-yellow/10 px-5 py-4">
          <p className="text-sm">
            <strong className="text-foreground">
              {summary.pendingApprovals}{" "}
              {summary.pendingApprovals === 1
                ? "entregável aguarda"
                : "entregáveis aguardam"}{" "}
              sua aprovação.
            </strong>{" "}
            Abra o projeto e vá em Entregáveis.
          </p>
        </Card>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Projetos em produção</h2>
            <p className="text-sm text-muted-foreground">
              Tudo que está ativo agora na sua organização.
            </p>
          </div>
        </div>

        {inProduction.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Nenhum projeto em produção no momento.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {inProduction.map((p) => (
              <PortalProductionTile key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {paused.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-muted-foreground">
            Pausados
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {paused.map((p) => (
              <PortalProductionTile key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-muted-foreground">
            Concluídos recentemente
          </h2>
          <ul className="flex flex-wrap gap-2">
            {done.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/portal/projects/${p.id}`}
                  className="inline-block rounded-lg border border-border bg-card/50 px-4 py-2 text-sm transition hover:border-brand-purple/40"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`p-4 ${highlight ? "border-brand-yellow/50 bg-brand-yellow/5" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-mono text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}
