import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { getActivityRiskSummary } from "@/lib/actions/activities";
import { listActiveClients } from "@/lib/actions/projects";
import { listScheduleProjectBlocks } from "@/lib/queries/schedule-board";
import { formatDate } from "@/lib/format";
import { ScheduleFilters } from "./schedule-filters";
import { ScheduleGlobalBoard } from "./schedule-global-board";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientId } = await searchParams;
  const [blocks, clients, risks] = await Promise.all([
    listScheduleProjectBlocks({ clientId: clientId || undefined }),
    listActiveClients(),
    getActivityRiskSummary(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Cronograma"
        title="Visão global"
        description="Tabela editável, Gantt clássico ou visão por fase — por projeto."
      />

      <ScheduleFilters clients={clients} selectedClientId={clientId} />

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_280px]">
        <ScheduleGlobalBoard blocks={blocks} />

        <aside className="space-y-4">
          <RiskPanel
            title="Atrasadas"
            empty="Nenhuma atividade atrasada."
            items={risks.delayed}
            tone="destructive"
          />
          <RiskPanel
            title="Vence em 7 dias"
            empty="Nada crítico esta semana."
            items={risks.dueSoon}
            tone="warning"
          />
        </aside>
      </div>
    </>
  );
}

function RiskPanel({
  title,
  empty,
  items,
  tone,
}: {
  title: string;
  empty: string;
  items: Awaited<ReturnType<typeof getActivityRiskSummary>>["delayed"];
  tone: "destructive" | "warning";
}) {
  return (
    <Card className="border-border p-4">
      <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {tone === "destructive" && (
          <span
            className="size-1.5 shrink-0 rounded-full bg-destructive/80"
            aria-hidden
          />
        )}
        {tone === "warning" && (
          <span
            className="size-1.5 shrink-0 rounded-full bg-warning/80"
            aria-hidden
          />
        )}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => {
            const project = item.project;
            return (
              <li key={item.id} className="text-sm">
                <p className="font-medium">{item.name}</p>
                {project && (
                  <Link
                    href={`/projects/${project.id}#cronograma`}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  >
                    {project.name}
                  </Link>
                )}
                <p className="font-mono text-[10px] text-muted-foreground">
                  até {formatDate(item.planned_end_date)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
