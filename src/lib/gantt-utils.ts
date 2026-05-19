/**
 * Helpers para o componente Gantt (posicionamento de barras).
 */
import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  format,
  parseISO,
  startOfDay,
  min as minDate,
  max as maxDate,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityStatus } from "@/types/database";

export interface GanttBar {
  id: string;
  label: string;
  sublabel?: string;
  start: string;
  end: string;
  status: ActivityStatus;
  groupKey?: string;
  groupLabel?: string;
  color?: string;
}

export function ganttRange(bars: GanttBar[], paddingDays = 2) {
  if (bars.length === 0) {
    const today = startOfDay(new Date());
    return {
      rangeStart: today,
      rangeEnd: addDays(today, 14),
      totalDays: 14,
    };
  }

  const starts = bars.map((b) => startOfDay(parseISO(b.start)));
  const ends = bars.map((b) => startOfDay(parseISO(b.end)));
  const rangeStart = addDays(minDate(starts), -paddingDays);
  const rangeEnd = addDays(maxDate(ends), paddingDays);
  const totalDays =
    differenceInCalendarDays(rangeEnd, rangeStart) + 1;

  return { rangeStart, rangeEnd, totalDays: Math.max(totalDays, 7) };
}

export function barPosition(
  start: string,
  end: string,
  rangeStart: Date,
  totalDays: number,
) {
  const s = startOfDay(parseISO(start));
  const e = startOfDay(parseISO(end));
  const left =
    (differenceInCalendarDays(s, rangeStart) / totalDays) * 100;
  const width =
    ((differenceInCalendarDays(e, s) + 1) / totalDays) * 100;
  return {
    left: Math.max(0, Math.min(100, left)),
    width: Math.max((1 / totalDays) * 100, Math.min(100 - left, width)),
  };
}

export const activityStatusBarClass: Record<ActivityStatus, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-gradient-to-r from-brand-purple to-brand-orange",
  completed: "bg-success",
  delayed: "bg-destructive",
};

export function activityProgressPercent(status: ActivityStatus): number {
  switch (status) {
    case "completed":
      return 100;
    case "in_progress":
      return 55;
    case "delayed":
      return 35;
    default:
      return 0;
  }
}

export function ganttMonthLabels(rangeStart: Date, rangeEnd: Date) {
  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
  return months.map((m) =>
    format(m, "MMM", { locale: ptBR }).replace(".", ""),
  );
}

