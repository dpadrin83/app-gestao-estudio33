"use server";

import { addDays, format, parseISO, subDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { completeText, isAiConfigured } from "@/lib/ai/client";
import {
  DASHBOARD_INSIGHTS_SYSTEM,
  SCHEDULE_SUGGESTION_SYSTEM,
  WEEKLY_SUMMARY_SYSTEM,
} from "@/lib/ai/prompts";
import { getHubRole } from "@/lib/auth/roles";
import { getSmartAlerts } from "@/lib/alerts/smart-alerts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActivityPhase,
  ActivityKind,
  AiGeneration,
  AiGenerationKind,
} from "@/types/database";
import type { ActionResult } from "@/lib/actions/projects";

export type SuggestedActivity = {
  name: string;
  phase: ActivityPhase;
  kind: ActivityKind;
  estimated_duration_days: number;
  visible_to_client: boolean;
  predecessor_index: number | null;
};

async function requireAdmin(): Promise<{ ok: false; error: string } | null> {
  const { role } = await getHubRole();
  if (role !== "admin") {
    return { ok: false, error: "Acesso restrito ao administrador." };
  }
  return null;
}

async function saveGeneration(
  projectId: string | null,
  kind: AiGenerationKind,
  content: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("ai_generations").insert({
    project_id: projectId,
    kind,
    content,
    metadata: metadata ?? null,
  });
}

async function buildProjectContext(projectId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "name, description, status, start_date, expected_end_date, contract_value, briefing_notes, client:clients(name)",
    )
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Projeto não encontrado.");

  const rawClient = project.client as unknown;
  const client =
    rawClient && typeof rawClient === "object" && !Array.isArray(rawClient)
      ? (rawClient as { name: string })
      : Array.isArray(rawClient)
        ? (rawClient[0] as { name: string } | undefined)
        : null;
  const weekStart = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [
    { data: activities },
    { data: deliverables },
    { data: sessions },
    { data: costs },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("name, phase, status, planned_end_date, kind")
      .eq("project_id", projectId)
      .order("planned_start_date"),
    supabase
      .from("deliverables")
      .select("name, status")
      .eq("project_id", projectId),
    supabase
      .from("time_sessions")
      .select("started_at, ended_at")
      .eq("project_id", projectId)
      .gte("started_at", `${weekStart}T00:00:00`),
    supabase
      .from("project_costs")
      .select("description, amount")
      .eq("project_id", projectId),
  ]);

  const actSummary = (activities ?? []).reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  let weekMs = 0;
  for (const s of sessions ?? []) {
    if (!s.ended_at) continue;
    weekMs +=
      new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
  }
  const weekHours = Math.round((weekMs / 3600000) * 10) / 10;

  const costTotal = (costs ?? []).reduce((s, c) => s + Number(c.amount), 0);

  return JSON.stringify(
    {
      projeto: project.name,
      cliente: client?.name ?? "—",
      status: project.status,
      prazo: {
        inicio: project.start_date,
        fim_previsto: project.expected_end_date,
      },
      valor_contrato: project.contract_value,
      briefing: project.briefing_notes,
      descricao: project.description,
      atividades: {
        total: activities?.length ?? 0,
        por_status: actSummary,
        lista: (activities ?? []).slice(0, 12).map((a) => ({
          nome: a.name,
          fase: a.phase,
          status: a.status,
          prazo: a.planned_end_date,
          marco: a.kind === "milestone",
        })),
      },
      entregaveis: (deliverables ?? []).map((d) => ({
        nome: d.name,
        status: d.status,
      })),
      horas_ultima_semana: weekHours,
      custos_registrados: costTotal,
    },
    null,
    2,
  );
}

export async function listAiGenerations(
  projectId: string,
  kind?: AiGenerationKind,
): Promise<AiGeneration[]> {
  const denied = await requireAdmin();
  if (denied) return [];

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("ai_generations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (kind) q = q.eq("kind", kind);

  const { data, error } = await q;
  if (error) {
    console.error("[listAiGenerations]", error);
    return [];
  }
  return (data ?? []) as AiGeneration[];
}

export async function generateWeeklySummary(
  projectId: string,
): Promise<ActionResult<{ content: string }>> {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isAiConfigured()) {
    return {
      ok: false,
      error: "Configure ANTHROPIC_API_KEY no .env.local para usar a IA.",
    };
  }

  try {
    const context = await buildProjectContext(projectId);
    const content = await completeText(
      WEEKLY_SUMMARY_SYSTEM,
      `Contexto do projeto (JSON):\n${context}\n\nGere o resumo semanal.`,
      1024,
    );
    await saveGeneration(projectId, "weekly_summary", content);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: { content } };
  } catch (e) {
    console.error("[generateWeeklySummary]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao gerar resumo.",
    };
  }
}

export async function suggestScheduleFromText(
  projectId: string,
  description: string,
): Promise<ActionResult<{ activities: SuggestedActivity[]; raw: string }>> {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isAiConfigured()) {
    return {
      ok: false,
      error: "Configure ANTHROPIC_API_KEY no .env.local para usar a IA.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name, start_date, expected_end_date, briefing_notes")
    .eq("id", projectId)
    .single();

  if (!project) return { ok: false, error: "Projeto não encontrado." };

  const prompt = `Projeto: ${project.name}
Data início: ${project.start_date ?? "não definida"}
Prazo final: ${project.expected_end_date ?? "não definido"}
Briefing salvo: ${project.briefing_notes ?? "—"}

Descrição do Danilo para montar o cronograma:
${description.trim()}`;

  try {
    const raw = await completeText(SCHEDULE_SUGGESTION_SYSTEM, prompt, 4096);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ok: false, error: "A IA não retornou JSON válido. Tente de novo." };
    }
    const parsed = JSON.parse(jsonMatch[0]) as {
      activities?: SuggestedActivity[];
    };
    const activities = parsed.activities ?? [];
    if (activities.length === 0) {
      return { ok: false, error: "Nenhuma atividade sugerida." };
    }

    await saveGeneration(projectId, "schedule_suggestion", raw, {
      description,
      count: activities.length,
    });

    return { ok: true, data: { activities, raw } };
  } catch (e) {
    console.error("[suggestScheduleFromText]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao sugerir cronograma.",
    };
  }
}

export async function applySuggestedSchedule(
  projectId: string,
  suggestions: SuggestedActivity[],
): Promise<ActionResult<{ count: number }>> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = await createSupabaseServerClient();

  const { count: existing } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((existing ?? 0) > 0) {
    return {
      ok: false,
      error: "Este projeto já tem atividades. Exclua antes de aplicar a sugestão.",
    };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("start_date")
    .eq("id", projectId)
    .single();

  const anchor =
    project?.start_date ?? format(new Date(), "yyyy-MM-dd");
  let cursor = parseISO(anchor);
  const idByIndex = new Map<number, string>();

  for (let i = 0; i < suggestions.length; i++) {
    const item = suggestions[i]!;
    const duration =
      item.kind === "milestone"
        ? 0
        : Math.max(item.estimated_duration_days, 1);
    const plannedStart = format(cursor, "yyyy-MM-dd");
    const plannedEnd =
      item.kind === "milestone"
        ? plannedStart
        : format(addDays(cursor, duration - 1), "yyyy-MM-dd");

    const { data: created, error } = await supabase
      .from("activities")
      .insert({
        project_id: projectId,
        name: item.name.trim(),
        phase: item.phase,
        kind: item.kind,
        estimated_duration_days: duration,
        planned_start_date: plannedStart,
        planned_end_date: plannedEnd,
        status: "not_started",
        visible_to_client: item.visible_to_client,
        sort_order: i,
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("[applySuggestedSchedule]", error);
      return { ok: false, error: "Erro ao criar atividades." };
    }

    idByIndex.set(i, created.id);
    cursor = addDays(parseISO(plannedEnd), 1);
  }

  for (let i = 0; i < suggestions.length; i++) {
    const predIdx = suggestions[i]!.predecessor_index;
    if (predIdx == null) continue;
    const succId = idByIndex.get(i);
    const predId = idByIndex.get(predIdx);
    if (!succId || !predId) continue;

    await supabase.from("activity_dependencies").insert({
      activity_id: succId,
      predecessor_id: predId,
      dependency_type: "FS",
      lag_days: 0,
    });
  }

  await supabase.rpc("recalculate_project_schedule", {
    p_project_id: projectId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  return { ok: true, data: { count: suggestions.length } };
}

export async function generateDashboardInsights(): Promise<
  ActionResult<{ content: string }>
> {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isAiConfigured()) {
    return {
      ok: false,
      error: "Configure ANTHROPIC_API_KEY no .env.local para usar a IA.",
    };
  }

  const alerts = await getSmartAlerts();
  const supabase = await createSupabaseServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, expected_end_date")
    .eq("status", "in_progress")
    .limit(8);

  const context = JSON.stringify(
    {
      alertas: alerts.map((a) => ({
        severidade: a.severity,
        titulo: a.title,
        detalhe: a.detail,
      })),
      projetos_em_producao: projects ?? [],
    },
    null,
    2,
  );

  try {
    const content = await completeText(
      DASHBOARD_INSIGHTS_SYSTEM,
      `Dados operacionais:\n${context}`,
      1024,
    );
    await saveGeneration(null, "smart_insights", content, {
      alertCount: alerts.length,
    });
    revalidatePath("/dashboard");
    return { ok: true, data: { content } };
  } catch (e) {
    console.error("[generateDashboardInsights]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao gerar insights.",
    };
  }
}

export async function saveProjectBriefingNotes(
  projectId: string,
  notes: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update({ briefing_notes: notes.trim() || null })
    .eq("id", projectId);

  if (error) {
    console.error("[saveProjectBriefingNotes]", error);
    return { ok: false, error: "Não foi possível salvar o briefing." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
