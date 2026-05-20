import Link from "next/link";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ganttMonthLabels, ganttRange } from "@/lib/gantt-utils";
import type {
  PortfolioGanttData,
  PortfolioGanttSort,
} from "@/lib/queries/portfolio-gantt";
import { PortfolioGanttControls } from "@/components/dashboard/portfolio-gantt-controls";
import { PortfolioGanttBoard } from "@/components/dashboard/portfolio-gantt-board";
import { PortfolioGanttExport } from "@/components/dashboard/portfolio-gantt-export";
import { schedulePath } from "@/lib/app-paths";
import { cn } from "@/lib/utils";
import { CalendarRange } from "lucide-react";

const EXPORT_ROOT_ID = "portfolio-gantt-export";

export function DashboardPortfolioGantt({
  data,
  clients,
  selectedClientId,
  selectedSort,
}: {
  data: PortfolioGanttData;
  clients: { id: string; name: string }[];
  selectedClientId?: string;
  selectedSort: PortfolioGanttSort;
}) {
  const { rangeStart, totalDays } = ganttRange(data.bars);
  const rangeEnd = new Date(
    rangeStart.getTime() + (totalDays - 1) * 86_400_000,
  );
  const months = ganttMonthLabels(rangeStart, rangeEnd);
  const todayLeft = todayLinePercent(rangeStart, totalDays);
  const scheduleHref = schedulePath(selectedClientId);

  return (
    <section
      id={EXPORT_ROOT_ID}
      className="card-glass mb-9 overflow-hidden rounded-3xl p-5 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Cronograma · Portfólio
          </p>
          <h2 className="text-lg font-semibold tracking-tight">
            Todos os projetos em andamento
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PortfolioGanttExport targetId={EXPORT_ROOT_ID} />
          <Link
            href={scheduleHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
          >
            <CalendarRange className="size-3.5" />
            {selectedClientId
              ? "Cronograma do cliente"
              : "Cronograma completo"}
          </Link>
        </div>
      </div>

      <PortfolioGanttControls
        clients={clients}
        selectedClientId={selectedClientId}
        selectedSort={selectedSort}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryKpi
          label="Em andamento"
          value={String(data.projectsInProgress).padStart(2, "0")}
          hint={
            data.projectsDueThisWeek > 0
              ? `${data.projectsWithSchedule} com cronograma · ${data.projectsDueThisWeek} vencem esta semana`
              : `${data.projectsWithSchedule} com cronograma`
          }
        />
        <SummaryKpi
          label="Atrasados"
          value={String(data.projectsOverdue).padStart(2, "0")}
          hint={
            data.projectsOverdue > 0
              ? "atividades ou prazo vencido"
              : "nenhum atraso"
          }
          warn={data.projectsOverdue > 0}
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
        <SummaryKpi
          label="Sem cronograma"
          value={String(data.projectsWithoutSchedule).padStart(2, "0")}
          hint="precisam de atividades"
        />
      </div>

      {data.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {selectedClientId
            ? "Nenhum projeto em produção para este cliente."
            : "Nenhum projeto em produção. "}
          {!selectedClientId && (
            <Link
              href="/projects/new"
              className="text-brand-orange hover:underline"
            >
              Criar projeto
            </Link>
          )}
        </p>
      ) : (
        <PortfolioGanttBoard
          rows={data.rows}
          bars={data.bars.map((b) => ({
            id: b.id,
            start: b.start,
            end: b.end,
          }))}
          rangeStartIso={rangeStart.toISOString()}
          totalDays={totalDays}
          todayLeft={todayLeft}
          months={months}
          projectsDueThisWeek={data.projectsDueThisWeek}
        />
      )}
    </section>
  );
}

function todayLinePercent(rangeStart: Date, totalDays: number): number | null {
  const today = startOfDay(new Date());
  const left =
    (differenceInCalendarDays(today, rangeStart) / totalDays) * 100;
  if (left < 0 || left > 100) return null;
  return left;
}

function SummaryKpi({
  label,
  value,
  hint,
  accent,
  warn,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border px-4 py-3.5",
        accent &&
          "bg-gradient-to-br from-brand-purple/15 to-brand-orange/5",
        warn && "border-destructive/40 bg-destructive/5",
        !accent && !warn && "bg-card/40",
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-3xl font-bold tracking-tight",
          warn && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
