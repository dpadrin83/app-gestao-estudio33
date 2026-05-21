import "server-only";
import { addDays, format, subDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFinancePageData } from "@/lib/queries/finance-overview";

export type SmartAlert = {
  id: string;
  severity: "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

export async function getSmartAlerts(): Promise<SmartAlert[]> {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const fiveDaysAgo = format(subDays(new Date(), 5), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");
  const alerts: SmartAlert[] = [];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("status", "in_progress");

  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return alerts;

  const projectMap = new Map(
    (projects ?? []).map((p) => [p.id, p.name as string]),
  );

  const { data: reviewStuck } = await supabase
    .from("activities")
    .select("id, name, project_id, planned_start_date")
    .in("project_id", projectIds)
    .eq("phase", "review")
    .neq("status", "completed")
    .lt("planned_start_date", fiveDaysAgo)
    .limit(5);

  for (const a of reviewStuck ?? []) {
    alerts.push({
      id: `review-stuck-${a.id}`,
      severity: "warning",
      title: "Revisão parada há dias",
      detail: `"${a.name}" em ${projectMap.get(a.project_id) ?? "projeto"}`,
      href: `/projects/${a.project_id}#cronograma`,
    });
  }

  const { data: pendingDeliverables } = await supabase
    .from("deliverables")
    .select("id, name, project_id, updated_at")
    .in("project_id", projectIds)
    .eq("status", "sent_to_client")
    .lt("updated_at", `${sevenDaysAgo}T23:59:59`)
    .limit(5);

  for (const d of pendingDeliverables ?? []) {
    alerts.push({
      id: `deliverable-wait-${d.id}`,
      severity: "warning",
      title: "Entregável aguardando cliente",
      detail: `"${d.name}" há mais de 7 dias`,
      href: `/projects/${d.project_id}#entregaveis`,
    });
  }

  const { data: completedActivities } = await supabase
    .from("activities")
    .select("id, name, project_id")
    .in("project_id", projectIds)
    .eq("status", "completed")
    .limit(30);

  if (completedActivities?.length) {
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("activity_id")
      .in(
        "project_id",
        projectIds,
      )
      .not("activity_id", "is", null);

    const linked = new Set(
      (deliverables ?? []).map((d) => d.activity_id).filter(Boolean),
    );

    for (const a of completedActivities) {
      if (linked.has(a.id)) continue;
      alerts.push({
        id: `no-deliverable-${a.id}`,
        severity: "info",
        title: "Atividade concluída sem entregável",
        detail: `"${a.name}" — considere registrar entrega`,
        href: `/projects/${a.project_id}#entregaveis`,
      });
      if (alerts.length >= 12) break;
    }
  }

  for (const pid of projectIds) {
    const { data: recentSessions } = await supabase
      .from("time_sessions")
      .select("id")
      .eq("project_id", pid)
      .gte("started_at", `${fourteenDaysAgo}T00:00:00`)
      .limit(1);

    if (!recentSessions?.length) {
      alerts.push({
        id: `idle-project-${pid}`,
        severity: "info",
        title: "Projeto sem horas registradas",
        detail: `${projectMap.get(pid)} — 14+ dias sem sessão`,
        href: `/projects/${pid}`,
      });
    }
    if (alerts.length >= 12) break;
  }

  const in7 = format(addDays(new Date(), 7), "yyyy-MM-dd");
  const { data: milestones } = await supabase
    .from("activities")
    .select("id, name, project_id, planned_end_date")
    .in("project_id", projectIds)
    .eq("kind", "milestone")
    .eq("visible_to_client", true)
    .neq("status", "completed")
    .gte("planned_end_date", today)
    .lte("planned_end_date", in7)
    .limit(3);

  for (const m of milestones ?? []) {
    alerts.push({
      id: `milestone-soon-${m.id}`,
      severity: "info",
      title: "Marco visível ao cliente esta semana",
      detail: `"${m.name}" até ${m.planned_end_date}`,
      href: `/projects/${m.project_id}#cronograma`,
    });
  }

  const finance = await getFinancePageData();
  for (const r of finance.atRisk.slice(0, 4)) {
    alerts.push({
      id: `margin-risk-${r.projectId}`,
      severity: "warning",
      title: "Margem abaixo do limite",
      detail: `${r.projectName} · ${r.marginPercent}% (meta ≥ ${finance.marginAlertPercent}%)`,
      href: `/projects/${r.projectId}#financeiro`,
    });
  }

  const overdueInvoice = finance.rows.filter(
    (r) =>
      r.paymentStatus === "invoiced" &&
      r.budget > 0 &&
      r.invoicedAt &&
      r.invoicedAt < format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  for (const r of overdueInvoice.slice(0, 3)) {
    alerts.push({
      id: `invoice-open-${r.projectId}`,
      severity: "warning",
      title: "Faturado há 30+ dias sem recebimento",
      detail: `${r.projectName} · ${r.clientName}`,
      href: `/projects/${r.projectId}#financeiro`,
    });
  }

  return alerts.slice(0, 12);
}
