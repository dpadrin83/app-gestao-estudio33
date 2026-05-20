import "server-only";
import {
  differenceInCalendarDays,
  format,
  max as maxDate,
  parseISO,
  startOfDay,
} from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GanttBar } from "@/lib/gantt-utils";
import type { ActivityStatus } from "@/types/database";

export interface PortfolioProjectRow {
  projectId: string;
  projectName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  daysToComplete: number;
  isOverdue: boolean;
  hasSchedule: boolean;
  status: ActivityStatus;
}

export interface PortfolioGanttData {
  rows: PortfolioProjectRow[];
  bars: GanttBar[];
  projectsInProgress: number;
  projectsWithSchedule: number;
  daysToCompleteAll: number;
  horizonEndDate: string | null;
}

export async function getPortfolioGanttData(
  now = new Date(),
): Promise<PortfolioGanttData> {
  const supabase = await createSupabaseServerClient();
  const today = startOfDay(now);
  const todayStr = format(today, "yyyy-MM-dd");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, expected_end_date, client:clients(name)")
    .eq("status", "in_progress")
    .order("name");

  if (error) {
    console.error("[getPortfolioGanttData]", error);
    return emptyPortfolio();
  }

  const list = projects ?? [];
  if (list.length === 0) return emptyPortfolio();

  const projectIds = list.map((p) => p.id);
  const { data: activities } = await supabase
    .from("activities")
    .select("project_id, planned_start_date, planned_end_date, status")
    .in("project_id", projectIds);

  const openByProject = new Map<
    string,
    { starts: string[]; ends: string[]; hasDelayed: boolean }
  >();

  for (const id of projectIds) {
    openByProject.set(id, { starts: [], ends: [], hasDelayed: false });
  }

  for (const a of activities ?? []) {
    if (a.status === "completed") continue;
    const bucket = openByProject.get(a.project_id);
    if (!bucket) continue;
    bucket.starts.push(a.planned_start_date as string);
    bucket.ends.push(a.planned_end_date as string);
    if ((a.planned_end_date as string) < todayStr) bucket.hasDelayed = true;
  }

  const rows: PortfolioProjectRow[] = [];
  const bars: GanttBar[] = [];

  for (const p of list) {
    const clientRaw = p.client as unknown;
    let clientName = "—";
    if (clientRaw && typeof clientRaw === "object") {
      const c = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
      clientName = (c as { name?: string })?.name ?? "—";
    }

    const bucket = openByProject.get(p.id)!;
    const hasOpenActivities = bucket.ends.length > 0;

    let startDate: string;
    let endDate: string;
    let hasSchedule: boolean;
    let isOverdue = bucket.hasDelayed;

    if (hasOpenActivities) {
      startDate = bucket.starts.reduce((min, d) => (d < min ? d : min));
      endDate = bucket.ends.reduce((max, d) => (d > max ? d : max));
      hasSchedule = true;
    } else if (p.expected_end_date) {
      startDate = todayStr;
      endDate = p.expected_end_date;
      hasSchedule = true;
      if (endDate < todayStr) isOverdue = true;
    } else {
      startDate = todayStr;
      endDate = todayStr;
      hasSchedule = false;
    }

    const endDay = startOfDay(parseISO(endDate));
    const daysToComplete = hasSchedule
      ? Math.max(0, differenceInCalendarDays(endDay, today))
      : 0;

    const status: ActivityStatus = !hasSchedule
      ? "not_started"
      : isOverdue
        ? "delayed"
        : daysToComplete === 0
          ? "in_progress"
          : "in_progress";

    const row: PortfolioProjectRow = {
      projectId: p.id,
      projectName: p.name,
      clientName,
      startDate,
      endDate,
      daysToComplete,
      isOverdue,
      hasSchedule,
      status,
    };
    rows.push(row);

    if (hasSchedule) {
      bars.push({
        id: p.id,
        label: p.name,
        sublabel: clientName,
        start: startDate,
        end: endDate,
        status,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.hasSchedule !== b.hasSchedule) return a.hasSchedule ? -1 : 1;
    return b.daysToComplete - a.daysToComplete;
  });

  const scheduledEnds = rows
    .filter((r) => r.hasSchedule)
    .map((r) => startOfDay(parseISO(r.endDate)));

  const horizonEnd =
    scheduledEnds.length > 0 ? maxDate(scheduledEnds) : null;

  const daysToCompleteAll =
    horizonEnd != null
      ? Math.max(0, differenceInCalendarDays(horizonEnd, today))
      : 0;

  return {
    rows,
    bars: bars.sort(
      (a, b) =>
        rows.findIndex((r) => r.projectId === a.id) -
        rows.findIndex((r) => r.projectId === b.id),
    ),
    projectsInProgress: list.length,
    projectsWithSchedule: rows.filter((r) => r.hasSchedule).length,
    daysToCompleteAll,
    horizonEndDate: horizonEnd ? format(horizonEnd, "yyyy-MM-dd") : null,
  };
}

function emptyPortfolio(): PortfolioGanttData {
  return {
    rows: [],
    bars: [],
    projectsInProgress: 0,
    projectsWithSchedule: 0,
    daysToCompleteAll: 0,
    horizonEndDate: null,
  };
}
