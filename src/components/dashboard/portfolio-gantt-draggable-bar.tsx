"use client";

import { useCallback, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function PortfolioGanttDraggableBar({
  startDate,
  endDate,
  openActivitiesCount,
  totalActivitiesCount,
  progressPercent,
  isOverdue,
  isDueThisWeek,
  colorClass,
  style,
  totalDays,
  onResizeEnd,
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
  totalDays: number;
  onResizeEnd: (deltaDays: number, timelineWidth: number) => void;
}) {
  const startLabel = format(parseISO(startDate), "dd MMM yyyy", { locale: ptBR });
  const endLabel = format(parseISO(endDate), "dd MMM yyyy", { locale: ptBR });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragPx, setDragPx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const baseWidth = parseFloat(style.width);

  const finishDrag = useCallback(
    (clientX: number) => {
      if (!dragging.current || !containerRef.current) return;
      dragging.current = false;
      const timelineWidth =
        containerRef.current.parentElement?.clientWidth ?? 0;
      const deltaPx = clientX - startX.current;
      setDragPx(0);
      if (timelineWidth > 0 && Math.abs(deltaPx) > 4) {
        const deltaDays = Math.round((deltaPx / timelineWidth) * totalDays);
        if (deltaDays !== 0) onResizeEnd(deltaDays, timelineWidth);
      }
    },
    [onResizeEnd, totalDays],
  );

  const timelineW = containerRef.current?.parentElement?.clientWidth ?? 1;
  const displayWidth =
    dragPx !== 0
      ? `${Math.max(0.5, baseWidth + (dragPx / timelineW) * 100)}%`
      : style.width;

  return (
    <div
      ref={containerRef}
      className="group/bar absolute top-1 bottom-1 z-[1]"
      style={{ left: style.left, width: displayWidth }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 right-2.5 rounded-md transition-shadow",
          isOverdue ? "bg-destructive" : colorClass,
          isDueThisWeek &&
            !isOverdue &&
            "ring-2 ring-warning/70 ring-offset-1 ring-offset-transparent",
          dragPx !== 0 && "opacity-80 shadow-lg ring-2 ring-brand-orange/50",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 z-[2] w-2.5 cursor-ew-resize rounded-r-md touch-none",
          "bg-white/25 hover:bg-white/40 active:bg-brand-orange/60",
          dragPx !== 0 && "bg-brand-orange/70",
        )}
        title="Arraste para ajustar o prazo final"
        aria-label={`Ajustar término: ${endLabel}`}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.button !== 0) return;
          dragging.current = true;
          startX.current = e.clientX;
          setDragPx(0);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setDragPx(e.clientX - startX.current);
        }}
        onPointerUp={(e) => {
          finishDrag(e.clientX);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          dragging.current = false;
          setDragPx(0);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
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
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-orange">
          Borda direita · ajustar prazo
        </p>
      </div>
    </div>
  );
}
