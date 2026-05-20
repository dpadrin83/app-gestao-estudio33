import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  activityStatusBarClass,
  barPosition,
  ganttMonthLabels,
  ganttRange,
} from "@/lib/gantt-utils";
import type { PortfolioGanttData } from "@/lib/queries/portfolio-gantt";
import { cn } from "@/lib/utils";
import { CalendarRange } from "lucide-react";

const BAR_COLORS = [
  "bg-gradient-to-r from-brand-orange to-brand-pink",
  "bg-gradient-to-r from-brand-pink to-brand-purple",
  "bg-gradient-to-r from-brand-purple to-brand-blue",
  "bg-gradient-to-r from-brand-blue to-brand-magenta",
  "bg-gradient-to-r from-brand-magenta to-brand-orange",
];

export function DashboardPortfolioGantt({ data }: { data: PortfolioGanttData }) {
  const { rangeStart, totalDays } = ganttRange(data.bars);
  const rangeEnd = new Date(
    rangeStart.getTime() + (totalDays - 1) * 86_400_000,
  );
  const months = ganttMonthLabels(rangeStart, rangeEnd);

  return (
    <section className="card-glass mb-9 overflow-hidden rounded-3xl p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Cronograma · Portfólio
          </p>
          <h2 className="text-lg font-semibold tracking-tight">
            Todos os projetos em andamento
          </h2>
        </div>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
        >
          <CalendarRange className="size-3.5" />
          Cronograma completo
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <SummaryKpi
          label="Projetos em andamento"
          value={String(data.projectsInProgress).padStart(2, "0")}
          hint={`${data.projectsWithSchedule} com cronograma`}
        />
        <SummaryKpi
          label="Dias para concluir todos"
          value={
            data.horizonEndDate ? String(data.daysToCompleteAll) : "—"
          }
          hint={
            data.horizonEndDate
              ? `horizonte · ${format(new Date(data.horizonEndDate), "dd MMM yyyy", { locale: ptBR })}`
              : "defina prazos nos projetos"
          }
          accent
        />
      </div>

      {data.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum projeto em produção.{" "}
          <Link href="/projects/new" className="text-brand-orange hover:underline">
            Criar projeto
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-black/20">
          <div className="min-w-[720px] p-4">
            <div className="mb-3 flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span>{format(rangeStart, "dd MMM", { locale: ptBR })}</span>
              <span>timeline · {totalDays} dias</span>
            </div>

            {data.bars.length > 0 && (
              <div className="mb-3 flex border-b border-border/60 pb-2 pl-[min(200px,28%)]">
                {months.map((m) => (
                  <span
                    key={m}
                    className="flex-1 text-center font-mono text-[9px] text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            <ul className="space-y-2">
              {data.rows.map((row, index) => {
                const bar = data.bars.find((b) => b.id === row.projectId);
                const pos = bar
                  ? barPosition(bar.start, bar.end, rangeStart, totalDays)
                  : null;
                const color = BAR_COLORS[index % BAR_COLORS.length];

                return (
                  <li
                    key={row.projectId}
                    className="grid grid-cols-[minmax(160px,1.4fr)_1fr_72px] items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${row.projectId}#cronograma`}
                        className="block truncate text-sm font-medium hover:text-brand-orange"
                      >
                        {row.projectName}
                      </Link>
                      <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.clientName}
                      </p>
                    </div>

                    <div className="relative h-7 rounded-md bg-secondary/30">
                      {bar && pos ? (
                        <div
                          className={cn(
                            "absolute top-1 bottom-1 rounded-md",
                            row.isOverdue
                              ? activityStatusBarClass.delayed
                              : color,
                          )}
                          style={{
                            left: `${pos.left}%`,
                            width: `${pos.width}%`,
                          }}
                          title={`${bar.start} → ${bar.end}`}
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] uppercase text-muted-foreground">
                          sem cronograma
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {row.hasSchedule ? (
                        <>
                          <p
                            className={cn(
                              "font-mono text-sm font-semibold tabular-nums",
                              row.isOverdue && "text-destructive",
                            )}
                          >
                            {row.daysToComplete === 0
                              ? "hoje"
                              : `${row.daysToComplete}d`}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            {format(new Date(row.endDate), "dd MMM", {
                              locale: ptBR,
                            })}
                          </p>
                        </>
                      ) : (
                        <Link
                          href={`/projects/${row.projectId}#cronograma`}
                          className="font-mono text-[9px] uppercase text-brand-orange hover:underline"
                        >
                          + cronograma
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryKpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border px-4 py-3.5",
        accent
          ? "bg-gradient-to-br from-brand-purple/15 to-brand-orange/5"
          : "bg-card/40",
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
