"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  activityStatusBarClass,
  barPosition,
} from "@/lib/gantt-utils";
import type { PortfolioProjectRow } from "@/lib/queries/portfolio-gantt";
import { resizeProjectScheduleEnd } from "@/lib/actions/portfolio-schedule";
import { PortfolioGanttDraggableBar } from "@/components/dashboard/portfolio-gantt-draggable-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const BAR_COLORS = [
  "bg-gradient-to-r from-brand-orange to-brand-pink",
  "bg-gradient-to-r from-brand-pink to-brand-purple",
  "bg-gradient-to-r from-brand-purple to-brand-blue",
  "bg-gradient-to-r from-brand-blue to-brand-magenta",
  "bg-gradient-to-r from-brand-magenta to-brand-orange",
];

type PendingResize = {
  projectId: string;
  projectName: string;
  deltaDays: number;
  endDate: string;
  openActivitiesCount: number;
};

export function PortfolioGanttBoard({
  rows,
  bars,
  rangeStartIso,
  totalDays,
  todayLeft,
  months,
  projectsDueThisWeek,
}: {
  rows: PortfolioProjectRow[];
  bars: { id: string; start: string; end: string }[];
  rangeStartIso: string;
  totalDays: number;
  todayLeft: number | null;
  months: string[];
  projectsDueThisWeek: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingResize | null>(null);
  const [isPending, startTransition] = useTransition();
  const rangeStart = parseISO(rangeStartIso);

  const requestResize = useCallback(
    (row: PortfolioProjectRow, deltaDays: number) => {
      if (!row.hasSchedule || deltaDays === 0) return;
      setPending({
        projectId: row.projectId,
        projectName: row.projectName,
        deltaDays,
        endDate: row.endDate,
        openActivitiesCount: row.openActivitiesCount,
      });
    },
    [],
  );

  function confirmResize() {
    if (!pending) return;
    startTransition(async () => {
      const result = await resizeProjectScheduleEnd(
        pending.projectId,
        pending.deltaDays,
      );
      if (result.ok) {
        const n = result.data?.updated ?? 0;
        const label =
          result.data?.kind === "project"
            ? "Prazo do projeto atualizado."
            : `Prazo final ajustado em ${n} atividade${n === 1 ? "" : "s"}.`;
        toast.success(label);
        setPending(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const newEndPreview = pending
    ? format(
        addDays(parseISO(pending.endDate), pending.deltaDays),
        "dd MMM yyyy",
        { locale: ptBR },
      )
    : "";

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-black/20">
        <div className="min-w-[800px] p-4">
          <div className="mb-3 flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <span>{format(rangeStart, "dd MMM", { locale: ptBR })}</span>
            <span className="inline-flex items-center gap-3">
              {todayLeft != null && (
                <span className="inline-flex items-center gap-1 text-brand-pink">
                  <span className="inline-block h-2 w-0.5 bg-brand-pink" />
                  hoje
                </span>
              )}
              {projectsDueThisWeek > 0 && (
                <span className="inline-flex items-center gap-1 text-warning">
                  <span className="inline-block size-2 rounded-sm ring-2 ring-warning/70" />
                  esta semana
                </span>
              )}
              timeline · {totalDays} dias
            </span>
          </div>

          {bars.length > 0 && (
            <div className="mb-3 grid grid-cols-[minmax(160px,1.2fr)_48px_1fr_72px] gap-3 border-b border-border/60 pb-2">
              <span />
              <span />
              <div className="flex">
                {months.map((m) => (
                  <span
                    key={m}
                    className="flex-1 text-center font-mono text-[9px] text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <span className="text-right font-mono text-[9px]">prazo</span>
            </div>
          )}

          <ul className="space-y-2">
            {rows.map((row, index) => {
              const bar = bars.find((b) => b.id === row.projectId);
              const pos = bar
                ? barPosition(bar.start, bar.end, rangeStart, totalDays)
                : null;
              const color = BAR_COLORS[index % BAR_COLORS.length];

              return (
                <li
                  key={row.projectId}
                  className={cn(
                    "grid grid-cols-[minmax(160px,1.2fr)_48px_1fr_72px] items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-white/[0.03]",
                    row.isDueThisWeek &&
                      !row.isOverdue &&
                      "bg-warning/[0.06] ring-1 ring-inset ring-warning/20",
                  )}
                >
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${row.projectId}#cronograma`}
                      className="flex items-center gap-1.5 truncate text-sm font-medium hover:text-brand-orange"
                    >
                      {row.isOverdue && (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-destructive"
                          aria-label="Atrasado"
                        />
                      )}
                      {row.isDueThisWeek && !row.isOverdue && (
                        <span
                          className="shrink-0 rounded bg-warning/20 px-1 py-0.5 font-mono text-[8px] uppercase tracking-wider text-warning"
                          title="Vence esta semana"
                        >
                          sem
                        </span>
                      )}
                      {row.projectName}
                    </Link>
                    <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {row.clientName}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    {row.progressPercent != null ? (
                      <>
                        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-secondary/50">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{ width: `${row.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
                          {row.progressPercent}%
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-[9px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </div>

                  <div className="relative h-7 rounded-md bg-secondary/30">
                    {todayLeft != null && (
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-brand-pink/90"
                        style={{ left: `${todayLeft}%` }}
                      />
                    )}
                    {bar && pos ? (
                      <PortfolioGanttDraggableBar
                        startDate={row.startDate}
                        endDate={row.endDate}
                        openActivitiesCount={row.openActivitiesCount}
                        totalActivitiesCount={row.totalActivitiesCount}
                        progressPercent={row.progressPercent}
                        isOverdue={row.isOverdue}
                        isDueThisWeek={row.isDueThisWeek}
                        colorClass={
                          row.isOverdue
                            ? activityStatusBarClass.delayed
                            : color
                        }
                        style={{
                          left: `${pos.left}%`,
                          width: `${pos.width}%`,
                        }}
                        totalDays={totalDays}
                        onResizeEnd={(deltaDays) =>
                          requestResize(row, deltaDays)
                        }
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
                            row.isDueThisWeek &&
                              !row.isOverdue &&
                              "text-warning",
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

      <Dialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar prazo final?</DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              {pending && (
                <>
                  <span className="block">
                    <strong className="text-foreground">
                      {pending.projectName}
                    </strong>
                    {pending.deltaDays > 0 ? " estende " : " reduz "}
                    o prazo em{" "}
                    <strong className="text-foreground">
                      {Math.abs(pending.deltaDays)} dia
                      {Math.abs(pending.deltaDays) === 1 ? "" : "s"}
                    </strong>
                    .
                  </span>
                  <span className="block">
                    Novo término previsto:{" "}
                    <span className="font-mono text-foreground">
                      {newEndPreview}
                    </span>
                  </span>
                  {pending.openActivitiesCount > 0 ? (
                    <span className="block text-xs">
                      Atividades no prazo máximo do projeto terão o fim
                      ajustado; o cronograma será recalculado.
                    </span>
                  ) : (
                    <span className="block text-xs">
                      O término previsto do projeto será atualizado.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setPending(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending || !pending}
              onClick={confirmResize}
            >
              {isPending ? "Aplicando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
