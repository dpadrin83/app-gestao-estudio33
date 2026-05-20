"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function PortfolioGanttBar({
  startDate,
  endDate,
  openActivitiesCount,
  totalActivitiesCount,
  progressPercent,
  isOverdue,
  isDueThisWeek,
  colorClass,
  style,
}: {
  startDate: string;
  endDate: string;
  openActivitiesCount: number;
  totalActivitiesCount: number;
  progressPercent: number | null;
  isOverdue: boolean;
  isDueThisWeek: boolean;
  colorClass: string;
  style: { left: string; width: string };
}) {
  const startLabel = format(parseISO(startDate), "dd MMM yyyy", { locale: ptBR });
  const endLabel = format(parseISO(endDate), "dd MMM yyyy", { locale: ptBR });

  return (
    <div
      className="group/bar absolute top-1 bottom-1 z-[1] cursor-default"
      style={style}
    >
      <div
        className={cn(
          "h-full w-full rounded-md transition-shadow",
          isOverdue ? "bg-destructive" : colorClass,
          isDueThisWeek &&
            !isOverdue &&
            "ring-2 ring-warning/70 ring-offset-1 ring-offset-transparent",
        )}
        aria-label={`${startLabel} até ${endLabel}`}
      />
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-lg group-hover/bar:block"
      >
        <p className="font-medium">{startLabel}</p>
        <p className="text-muted-foreground">→ {endLabel}</p>
        <p className="mt-1.5 text-muted-foreground">
          {openActivitiesCount > 0
            ? `${openActivitiesCount} atividade${openActivitiesCount === 1 ? "" : "s"} aberta${openActivitiesCount === 1 ? "" : "s"}`
            : "Prazo do projeto"}
          {totalActivitiesCount > 0 &&
            ` · ${totalActivitiesCount} no total`}
        </p>
        {progressPercent != null && (
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {progressPercent}% concluído
          </p>
        )}
        {isDueThisWeek && !isOverdue && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-warning">
            Vence esta semana
          </p>
        )}
      </div>
    </div>
  );
}
