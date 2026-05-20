import "server-only";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDate,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActivityRiskSummary } from "@/lib/actions/activities";
import { listFinanceOverview } from "@/lib/actions/finance";
import { getActiveSession } from "@/lib/actions/sessions";
import { getSmartAlerts } from "@/lib/alerts/smart-alerts";
import { listPendingDeliverables } from "@/lib/queries/pending-deliverables";
import { listProjectsEnriched } from "@/lib/queries/projects-list";
import { listUpcomingRenewals } from "@/lib/queries/service-renewals";
import { getDashboardStats } from "@/lib/queries/stats";
import type { ProjectListItem } from "@/lib/queries/projects-list";

export type CalendarDayMark = "entrega" | "marco" | "aprov" | null;

export interface HubCalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  mark: CalendarDayMark;
}

export interface HubDashboardData {
  greeting: string;
  firstName: string;
  dateLabel: string;
  heroSummary: string;
  focus: {
    eyebrow: string;
    title: string;
    body: string;
    footer: string;
    href: string;
  } | null;
  pendingDeliverablesCount: number;
  overdueActivitiesCount: number;
  calendar: {
    monthTitle: string;
    subtitle: string;
    days: HubCalendarDay[];
  };
  finance: {
    bars: Array<{ heightPercent: number; isPast: boolean; isCurrent: boolean; isFuture: boolean }>;
    monthLabels: string[];
    currentMonthLabel: string;
    currentMonthValue: number;
    annualProgressPercent: number;
  };
  featuredProject: {
    id: string;
    name: string;
    clientName: string;
    serviceLine: string | null;
    tag: string;
    nextHint: string;
    progressPercent: number | null;
  } | null;
  nextActivity: {
    id: string;
    name: string;
    projectName: string;
    projectId: string;
    isDelayed: boolean;
    plannedEndDate: string;
    detail: string;
  } | null;
  weekForecast: Array<{
    key: string;
    label: string;
    isToday: boolean;
    count: number;
    statusLabel: string;
    tone: "entrega" | "busy" | "aprov" | "calm";
  }>;
  capacity: {
    hoursWeek: number;
    hoursLimit: number;
    percent: number;
    withinLimit: boolean;
  };
  projects: ProjectListItem[];
  activeSession: Awaited<ReturnType<typeof getActiveSession>>;
  renewals: Awaited<ReturnType<typeof listUpcomingRenewals>>;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function firstNameFromEmail(email: string | undefined): string {
  if (!email) return "equipe";
  const local = email.split("@")[0] ?? "equipe";
  const part = local.split(/[._-]/)[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return text.slice(0, 2).toUpperCase();
}

export async function getHubDashboardData(
  now = new Date(),
): Promise<HubDashboardData> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    stats,
    risks,
    activeSession,
    smartAlerts,
    pendingDeliverables,
    renewals,
    projects,
    financeRows,
  ] = await Promise.all([
    getDashboardStats(now),
    getActivityRiskSummary(),
    getActiveSession(),
    getSmartAlerts(),
    listPendingDeliverables(8),
    listUpcomingRenewals(),
    listProjectsEnriched({ status: ["in_progress"] }),
    listFinanceOverview(),
  ]);

  const firstName = firstNameFromEmail(user?.email);
  const greeting = greetingForHour(now.getHours());
  const dateLabel = format(now, "EEEE · d MMM yyyy", { locale: ptBR });

  const overdueActivitiesCount = risks.delayed.length;
  const pendingDeliverablesCount = stats.pendingDeliverablesCount;
  const activeCount = stats.activeProjectsCount;

  const heroParts: string[] = [];
  heroParts.push(
    `${activeCount} projeto${activeCount === 1 ? "" : "s"} em curso`,
  );
  if (overdueActivitiesCount > 0) {
    heroParts.push(
      `${overdueActivitiesCount} com prazo estourado`,
    );
  }
  if (pendingDeliverablesCount > 0) {
    heroParts.push(
      `${String(pendingDeliverablesCount).padStart(2, "0")} entregável${pendingDeliverablesCount === 1 ? "" : "is"} aguardando cliente`,
    );
  }
  const heroSummary =
    heroParts.length > 0
      ? `${heroParts.join(", ")}.`
      : "Operação em dia — nenhum alerta crítico no momento.";

  const focus = buildFocus(risks, pendingDeliverables, smartAlerts);
  const calendar = await buildCalendar(now, supabase);
  const finance = buildFinanceChart(financeRows, now);
  const featuredProject = pickFeaturedProject(projects, pendingDeliverables);
  const nextActivity = buildNextActivity(risks, smartAlerts);
  const weekForecast = await buildWeekForecast(now, supabase);
  const hoursWeek = Math.round(stats.totalMsWeek / 3_600_000);
  const hoursLimit = 32;
  const percent = Math.min(100, Math.round((hoursWeek / hoursLimit) * 100));

  return {
    greeting,
    firstName,
    dateLabel,
    heroSummary,
    focus,
    pendingDeliverablesCount,
    overdueActivitiesCount,
    calendar,
    finance,
    featuredProject,
    nextActivity,
    activeSession,
    renewals,
    weekForecast,
    capacity: {
      hoursWeek,
      hoursLimit,
      percent,
      withinLimit: hoursWeek <= hoursLimit,
    },
    projects,
  };
}

function buildFocus(
  risks: Awaited<ReturnType<typeof getActivityRiskSummary>>,
  pending: Awaited<ReturnType<typeof listPendingDeliverables>>,
  alerts: Awaited<ReturnType<typeof getSmartAlerts>>,
): HubDashboardData["focus"] {
  const delayed = risks.delayed[0];
  if (delayed) {
    return {
      eyebrow: "Atividade prioritária",
      title: `${delayed.name}${delayed.project ? ` — ${delayed.project.name}` : ""}`,
      body: `Prazo previsto ${format(new Date(delayed.planned_end_date), "dd MMM", { locale: ptBR })} já passou. Priorize para destravar o cronograma.`,
      footer: "Próxima ação · Cronograma",
      href: delayed.project
        ? `/projects/${delayed.project.id}#cronograma`
        : "/schedule",
    };
  }

  const pendingD = pending[0];
  if (pendingD) {
    return {
      eyebrow: "Aguardando cliente",
      title: pendingD.name,
      body: `${pendingD.clientName} · ${pendingD.project.name}. Envie um lembrete ou alinhe feedback para seguir a produção.`,
      footer: "Próxima ação · Entregáveis",
      href: `/projects/${pendingD.project.id}#entregaveis`,
    };
  }

  const alert = alerts[0];
  if (alert) {
    return {
      eyebrow: "Alerta operacional",
      title: alert.title,
      body: alert.detail,
      footer: "Ver detalhe",
      href: alert.href ?? "/projects",
    };
  }

  return {
    eyebrow: "Foco de hoje",
    title: "Nenhum bloqueio crítico na fila.",
    body: "Use o tempo para avançar entregas da semana ou revisar o pipeline de projetos.",
    footer: "Explorar · Projetos",
    href: "/projects",
  };
}

async function buildCalendar(
  now: Date,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<HubDashboardData["calendar"]> {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = addDays(
    startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 0 }),
    6,
  );

  const monthEndStr = format(monthEnd, "yyyy-MM-dd");
  const monthStartStr = format(monthStart, "yyyy-MM-dd");

  const [{ data: activities }, { data: deliverables }] = await Promise.all([
    supabase
      .from("activities")
      .select("planned_end_date, kind, status")
      .gte("planned_end_date", monthStartStr)
      .lte("planned_end_date", monthEndStr)
      .neq("status", "completed"),
    supabase
      .from("deliverables")
      .select("updated_at, status")
      .eq("status", "approved")
      .gte("updated_at", `${monthStartStr}T00:00:00`)
      .lte("updated_at", `${monthEndStr}T23:59:59`),
  ]);

  const marks = new Map<string, CalendarDayMark>();
  for (const a of activities ?? []) {
    const key = a.planned_end_date as string;
    const kind = a.kind as string;
    const existing = marks.get(key);
    if (kind === "milestone") {
      marks.set(key, "marco");
    } else if (!existing || existing === "aprov") {
      marks.set(key, "entrega");
    }
  }
  for (const d of deliverables ?? []) {
    const day = format(new Date(d.updated_at as string), "yyyy-MM-dd");
    if (!marks.has(day)) marks.set(day, "aprov");
  }

  const days: HubCalendarDay[] = eachDayOfInterval({
    start: gridStart,
    end: gridEnd,
  }).map((date) => ({
    date,
    inMonth: isSameMonth(date, now),
    isToday: isSameDay(date, now),
    mark: marks.get(format(date, "yyyy-MM-dd")) ?? null,
  }));

  const markersInMonth = (activities ?? []).length;
  const completedInMonth = (deliverables ?? []).length;

  return {
    monthTitle: format(now, "MMMM", { locale: ptBR }),
    subtitle: `${markersInMonth} marco${markersInMonth === 1 ? "" : "s"} previsto${markersInMonth === 1 ? "" : "s"} no mês · ${completedInMonth} aprovação${completedInMonth === 1 ? "" : "ões"} registrada${completedInMonth === 1 ? "" : "s"}`,
    days,
  };
}

function buildFinanceChart(
  rows: Awaited<ReturnType<typeof listFinanceOverview>>,
  now: Date,
): HubDashboardData["finance"] {
  const year = now.getFullYear();
  const monthly = Array.from({ length: 12 }, () => 0);
  let annualBudget = 0;

  for (const r of rows) {
    annualBudget += r.budget;
    if (r.paymentStatus === "received" && r.budget > 0) {
      monthly[now.getMonth()] += r.budget;
    }
  }

  const max = Math.max(...monthly, 1);
  const currentMonth = now.getMonth();
  const monthLabels = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];

  const receivedTotal = monthly.reduce((s, v) => s + v, 0);
  const annualProgressPercent =
    annualBudget > 0
      ? Math.min(100, Math.round((receivedTotal / annualBudget) * 100))
      : 0;

  return {
    monthLabels,
    bars: monthly.map((value, i) => ({
      heightPercent: Math.max(8, Math.round((value / max) * 100)),
      isPast: i < currentMonth,
      isCurrent: i === currentMonth,
      isFuture: i > currentMonth,
    })),
    currentMonthLabel: monthLabels[currentMonth] ?? "—",
    currentMonthValue: monthly[currentMonth] ?? 0,
    annualProgressPercent,
  };
}

function pickFeaturedProject(
  projects: ProjectListItem[],
  pending: Awaited<ReturnType<typeof listPendingDeliverables>>,
): HubDashboardData["featuredProject"] {
  const withPending = projects.find((p) => p.pendingDeliverables > 0);
  const pick = withPending ?? projects[0];
  if (!pick) return null;

  const clientName =
    pick.client && typeof pick.client === "object" && "name" in pick.client
      ? String(pick.client.name)
      : "Cliente";

  const pendingForProject = pending.find((d) => d.project.id === pick.id);
  const tag = pendingForProject
    ? "aguardando cliente"
    : pick.atRisk
      ? "prazo em risco"
      : "em produção";

  return {
    id: pick.id,
    name: pick.name,
    clientName,
    serviceLine: pick.service_line,
    tag,
    nextHint: pendingForProject
      ? `Entregável: ${pendingForProject.name}`
      : pick.expected_end_date
        ? `Prazo ${format(new Date(pick.expected_end_date), "dd MMM", { locale: ptBR })}`
        : "Abrir cronograma e entregáveis",
    progressPercent: pick.progressPercent,
  };
}

function buildNextActivity(
  risks: Awaited<ReturnType<typeof getActivityRiskSummary>>,
  alerts: Awaited<ReturnType<typeof getSmartAlerts>>,
): HubDashboardData["nextActivity"] {
  const a = risks.delayed[0] ?? risks.dueSoon[0];
  if (a) {
    const isDelayed = risks.delayed.some((d) => d.id === a.id);
    const today = new Date();
    const end = new Date(a.planned_end_date);
    const diffDays = Math.floor(
      (today.getTime() - end.getTime()) / 86_400_000,
    );
    return {
      id: a.id,
      name: a.name,
      projectName: a.project?.name ?? "Projeto",
      projectId: a.project?.id ?? "",
      isDelayed,
      plannedEndDate: a.planned_end_date,
      detail: isDelayed
        ? `Atividade atrasada em ${diffDays} dia${diffDays === 1 ? "" : "s"}. Revise escopo ou prazo com o cliente.`
        : `Vence em ${format(end, "dd MMM", { locale: ptBR })}. Planeje a execução nos próximos dias.`,
    };
  }

  const alert = alerts[0];
  if (alert) {
    return {
      id: alert.id,
      name: alert.title,
      projectName: "Operação",
      projectId: "",
      isDelayed: alert.severity === "warning",
      plannedEndDate: format(new Date(), "yyyy-MM-dd"),
      detail: alert.detail,
    };
  }

  return null;
}

async function buildWeekForecast(
  now: Date,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<HubDashboardData["weekForecast"]> {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = weekStart;
  while (days.length < 5) {
    const dow = getDay(cursor);
    if (dow !== 0 && dow !== 6) days.push(cursor);
    cursor = addDays(cursor, 1);
    if (days.length === 0 && cursor > addDays(weekStart, 14)) break;
  }
  while (days.length < 5) {
    cursor = addDays(days[days.length - 1] ?? now, 1);
    const dow = getDay(cursor);
    if (dow !== 0 && dow !== 6) days.push(cursor);
  }

  const from = format(days[0]!, "yyyy-MM-dd");
  const to = format(days[days.length - 1]!, "yyyy-MM-dd");

  const { data: activities } = await supabase
    .from("activities")
    .select("planned_end_date, kind, phase")
    .gte("planned_end_date", from)
    .lte("planned_end_date", to)
    .neq("status", "completed");

  const counts = new Map<string, { total: number; milestones: number; reviews: number }>();
  for (const d of days) {
    counts.set(format(d, "yyyy-MM-dd"), { total: 0, milestones: 0, reviews: 0 });
  }

  for (const a of activities ?? []) {
    const key = a.planned_end_date as string;
    const bucket = counts.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (a.kind === "milestone") bucket.milestones += 1;
    if (a.phase === "review") bucket.reviews += 1;
  }

  return days.map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const c = counts.get(key) ?? { total: 0, milestones: 0, reviews: 0 };
    const isToday = isSameDay(date, now);
    let tone: "entrega" | "busy" | "aprov" | "calm" = "calm";
    let statusLabel = "leve";
    if (c.milestones > 0) {
      tone = "aprov";
      statusLabel = "marcos";
    } else if (c.total >= 4) {
      tone = "busy";
      statusLabel = "tarefas";
    } else if (c.total >= 1) {
      tone = "entrega";
      statusLabel = c.total === 1 ? "entrega" : "entregas";
    }
    const label = isToday
      ? `Hoje · ${format(date, "EEE", { locale: ptBR })}`
      : format(date, "EEE", { locale: ptBR });
    return {
      key,
      label,
      isToday,
      count: c.total,
      statusLabel,
      tone,
    };
  });
}

export { initials };
