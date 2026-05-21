"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectCostSchema, type ProjectCostFormValues } from "@/lib/schemas/project-cost";
import { durationBetween } from "@/lib/format";
import type { ProjectCost, TimeSession } from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function getHourlyRate(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "hourly_rate")
    .maybeSingle();

  const rate = data?.value;
  if (typeof rate === "number") return rate;
  if (typeof rate === "string") return Number(rate) || 150;
  return 150;
}

export async function listProjectCosts(projectId: string): Promise<ProjectCost[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_costs")
    .select("*")
    .eq("project_id", projectId)
    .order("incurred_at", { ascending: false });

  if (error) {
    console.error("[listProjectCosts]", error);
    return [];
  }
  return (data ?? []) as ProjectCost[];
}

export async function createProjectCost(
  projectId: string,
  values: ProjectCostFormValues,
): Promise<ActionResult> {
  const parsed = ProjectCostSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const amount = Number(parsed.data.amount.replace(",", "."));

  const { error } = await supabase.from("project_costs").insert({
    project_id: projectId,
    description: parsed.data.description.trim(),
    amount,
    incurred_at: parsed.data.incurred_at,
  });

  if (error) {
    console.error("[createProjectCost]", error);
    return { ok: false, error: "Não foi possível lançar o custo." };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/finance");
  return { ok: true };
}

export async function deleteProjectCost(
  costId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_costs").delete().eq("id", costId);
  if (error) {
    return { ok: false, error: "Não foi possível excluir o custo." };
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/finance");
  return { ok: true };
}

export interface ProjectFinanceSummary {
  budget: number;
  costsTotal: number;
  hoursMs: number;
  hourlyRate: number;
  laborCost: number;
  margin: number;
}

export async function getProjectFinanceSummary(
  projectId: string,
  contractValue: number | null,
): Promise<ProjectFinanceSummary> {
  const supabase = await createSupabaseServerClient();
  const [costs, sessions, hourlyRate] = await Promise.all([
    listProjectCosts(projectId),
    supabase
      .from("time_sessions")
      .select("started_at, ended_at")
      .eq("project_id", projectId),
    getHourlyRate(),
  ]);

  const budget = contractValue ?? 0;
  const costsTotal = costs.reduce((s, c) => s + Number(c.amount), 0);
  let hoursMs = 0;
  for (const s of (sessions.data ?? []) as Pick<TimeSession, "started_at" | "ended_at">[]) {
    hoursMs += durationBetween(s.started_at, s.ended_at);
  }
  const laborCost = (hoursMs / 3_600_000) * hourlyRate;
  const margin = budget - costsTotal - laborCost;

  return { budget, costsTotal, hoursMs, hourlyRate, laborCost, margin };
}

export async function listFinanceOverview() {
  const { getFinancePageData } = await import("@/lib/queries/finance-overview");
  const data = await getFinancePageData();
  return data.rows.map((r) => ({
    projectId: r.projectId,
    projectName: r.projectName,
    clientName: r.clientName,
    paymentStatus: r.paymentStatus,
    budget: r.budget,
    costsTotal: r.costsTotal,
    laborCost: r.laborCost,
    margin: r.margin,
    marginPercent: r.marginPercent,
    invoicedAt: r.invoicedAt,
    receivedAt: r.receivedAt,
  }));
}
