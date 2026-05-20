import "server-only";
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  max as maxDate,
  parseISO,
  startOfDay,
} from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GanttBar } from "@/lib/gantt-utils";
import type { ActivityStatus } from "@/types/database";

export type PortfolioGanttSort = "days" | "name" | "overdue" | "progress";

export interface PortfolioProjectRow {
  projectId: string;
  projectName: string;
  clientName: string;
  clientId: string | null;
  startDate: string;
  endDate: string;
  daysToComplete: number;
  isOverdue: boolean;
  hasSchedule: boolean;
  status: ActivityStatus;
  progressPercent: number | null;
  openActivitiesCount: number;
  totalActivitiesCount: number;
  isDueThisWeek: boolean;
}

export interface PortfolioGanttData {
  rows: PortfolioProjectRow[];
  bars: GanttBar[];
  projectsInProgress: number;
  projectsWithSchedule: number;
  projectsOverdue: number;
  projectsWithoutSchedule: number;
  projectsDueThisWeek: number;
  daysToCompleteAll: number;
  horizonEndDate: string | null;
}

export async function getPortfolioGanttData(
  opts?: { clientId?: string; sort?: PortfolioGanttSort },
  now = new Date(),
): Promise<PortfolioGanttData> {
  const supabase = await createSupabaseServerClient();
  const today = startOfDay(now);
  const todayStr = format(today, "yyyy-MM-dd");
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const sort = opts?.sort ?? "days";

  let query = supabase
    .from("projects")
    .select("id, name, expected_end_date, client_id, client:clients(id, name)")
    .eq("status", "in_progress")
    .order("name");

  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }

  const { data: projects, error } = await query;

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
  const progressByProject = new Map<
    string,
    { total: number; completed: number }
  >();

  for (const id of projectIds) {
    openByProject.set(id, { starts: [], ends: [], hasDelayed: false });
    progressByProject.set(id, { total: 0, completed: 0 });
  }

  for (const a of activities ?? []) {
    const prog = progressByProject.get(a.project_id);
    if (prog) {
      prog.total += 1;
      if (a.status === "completed") prog.completed += 1;
    }
    if (a.status === "completed") continue;
    const bucket = openByProject.get(a.project_id);
    if (!bucket) continue;
    bucket.starts.push(a.planned_start_date as string);
    bucket.ends.push(a.planned_end_date as string);
    if ((a.planned_end_date as string) < todayStr) bucket.hasDelayed = true;
  }

  const rows: PortfolioProjectRow[] = [];

  for (const p of list) {
    const clientRaw = p.client as unknown;
    let clientName = "—";
    let clientId: string | null = p.client_id ?? null;
    if (clientRaw && typeof clientRaw === "object") {
      const c = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
      clientName = (c as { name?: string })?.name ?? "—";
      clientId = (c as { id?: string })?.id ?? clientId;
    }

    const bucket = openByProject.get(p.id)!;
    const hasOpenActivities = bucket.ends.length > 0;
    const prog = progressByProject.get(p.id)!;

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

    const progressPercent =
      prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : null;

    const isDueThisWeek =
      hasSchedule &&
      !isOverdue &&
      endDay >= today &&
      endDay <= weekEnd;

    const status: ActivityStatus = !hasSchedule
      ? "not_started"
      : isOverdue
        ? "delayed"
        : "in_progress";

    const row: PortfolioProjectRow = {
      projectId: p.id,
      projectName: p.name,
      clientName,
      clientId,
      startDate,
      endDate,
      daysToComplete,
      isOverdue,
      hasSchedule,
      status,
      progressPercent,
      openActivitiesCount: bucket.ends.length,
      totalActivitiesCount: prog.total,
      isDueThisWeek,
    };
    rows.push(row);
  }

  sortRows(rows, sort);

  const sortedBars: GanttBar[] = rows
    .filter((r) => r.hasSchedule)
    .map((r) => ({
      id: r.projectId,
      label: r.projectName,
      sublabel: r.clientName,
      start: r.startDate,
      end: r.endDate,
      status: r.status,
    }));

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
    bars: sortedBars,
    projectsInProgress: list.length,
    projectsWithSchedule: rows.filter((r) => r.hasSchedule).length,
    projectsOverdue: rows.filter((r) => r.isOverdue).length,
    projectsWithoutSchedule: rows.filter((r) => !r.hasSchedule).length,
    projectsDueThisWeek: rows.filter((r) => r.isDueThisWeek).length,
    daysToCompleteAll,
    horizonEndDate: horizonEnd ? format(horizonEnd, "yyyy-MM-dd") : null,
  };
}

function sortRows(rows: PortfolioProjectRow[], sort: PortfolioGanttSort) {
  rows.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.projectName.localeCompare(b.projectName, "pt-BR");
      case "overdue":
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return b.daysToComplete - a.daysToComplete;
      case "progress":
        return (b.progressPercent ?? -1) - (a.progressPercent ?? -1);
      case "days":
      default:
        if (a.hasSchedule !== b.hasSchedule) return a.hasSchedule ? -1 : 1;
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return b.daysToComplete - a.daysToComplete;
    }
  });
}

function emptyPortfolio(): PortfolioGanttData {
  return {
    rows: [],
    bars: [],
    projectsInProgress: 0,
    projectsWithSchedule: 0,
    projectsOverdue: 0,
    projectsWithoutSchedule: 0,
    projectsDueThisWeek: 0,
    daysToCompleteAll: 0,
    horizonEndDate: null,
  };
}
