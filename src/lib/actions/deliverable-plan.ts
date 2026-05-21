"use server";

import { revalidatePath } from "next/cache";
import { addDays, format, parseISO } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DeliverablePlanItemSchema,
  type DeliverablePlanItemFormValues,
} from "@/lib/schemas/deliverable-plan";
import { ExecutionChecklistSchema } from "@/lib/schemas/execution-checklist";
import {
  buildDefaultChecklist,
  parseExecutionChecklist,
} from "@/lib/playbooks/execution-checklist";
import type { DeliverablePlanItem, ExecutionChecklistItem } from "@/types/database";
import type { ActionResult } from "@/lib/actions/deliverables";

function mapPlanRow(
  row: Omit<DeliverablePlanItem, "predecessor" | "execution_checklist"> & {
    execution_checklist?: unknown;
  },
): Omit<DeliverablePlanItem, "predecessor"> {
  return {
    ...row,
    execution_checklist: parseExecutionChecklist(row.execution_checklist),
  };
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/portal/projects/${projectId}`);
}

export async function getDeliverablePlan(
  projectId: string,
): Promise<DeliverablePlanItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_deliverable_plan_items")
    .select(
      `
      *,
      professional:studio_professionals(id, name),
      deliverable:deliverables(id, name, status)
    `,
    )
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getDeliverablePlan]", error);
    return [];
  }

  const rows = (data ?? []).map((r) =>
    mapPlanRow(r as Omit<DeliverablePlanItem, "predecessor" | "execution_checklist"> & {
      execution_checklist?: unknown;
    }),
  );
  const nameById = new Map(rows.map((r) => [r.id, r.name]));

  return rows.map((row) => ({
    ...row,
    predecessor: row.predecessor_id
      ? {
          id: row.predecessor_id,
          name: nameById.get(row.predecessor_id) ?? "—",
        }
      : null,
  }));
}

async function nextSortOrder(projectId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("project_deliverable_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  return count ?? 0;
}

function wouldCreateCycle(
  items: { id: string; predecessor_id: string | null }[],
  itemId: string,
  newPredecessorId: string | null,
): boolean {
  if (!newPredecessorId || itemId === newPredecessorId) return true;
  const predMap = new Map(
    items.map((i) => [i.id, i.id === itemId ? newPredecessorId : i.predecessor_id]),
  );
  let current: string | null = newPredecessorId;
  const visited = new Set<string>();
  while (current) {
    if (current === itemId) return true;
    if (visited.has(current)) return true;
    visited.add(current);
    current = predMap.get(current) ?? null;
  }
  return false;
}

export async function createDeliverablePlanItem(
  projectId: string,
  values: DeliverablePlanItemFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = DeliverablePlanItemSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const existing = await getDeliverablePlan(projectId);
  const predecessorId =
    parsed.data.predecessor_id && parsed.data.predecessor_id !== ""
      ? parsed.data.predecessor_id
      : null;

  if (predecessorId && !existing.some((i) => i.id === predecessorId)) {
    return { ok: false, error: "Etapa anterior inválida." };
  }

  const { data: del, error: delErr } = await supabase
    .from("deliverables")
    .insert({
      project_id: projectId,
      name: parsed.data.name.trim(),
      type: parsed.data.deliverable_type,
      status: "draft",
    })
    .select("id")
    .single();

  if (delErr || !del) {
    console.error("[createDeliverablePlanItem deliverable]", delErr);
    return { ok: false, error: "Não foi possível criar o entregável." };
  }

  await supabase.from("deliverable_versions").insert({
    deliverable_id: del.id,
    version_number: 1,
    external_link: null,
    notes: parsed.data.notes?.trim() || null,
  });

  const { data, error } = await supabase
    .from("project_deliverable_plan_items")
    .insert({
      project_id: projectId,
      name: parsed.data.name.trim(),
      deliverable_type: parsed.data.deliverable_type,
      estimated_days: parsed.data.estimated_days,
      professional_id:
        parsed.data.professional_id && parsed.data.professional_id !== ""
          ? parsed.data.professional_id
          : null,
      predecessor_id: predecessorId,
      deliverable_id: del.id,
      notes: parsed.data.notes?.trim() || null,
      sort_order: await nextSortOrder(projectId),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createDeliverablePlanItem]", error);
    return { ok: false, error: "Não foi possível salvar no plano." };
  }

  revalidateProject(projectId);
  return { ok: true, data: { id: data.id } };
}

export async function updateDeliverablePlanItem(
  itemId: string,
  projectId: string,
  values: DeliverablePlanItemFormValues,
): Promise<ActionResult> {
  const parsed = DeliverablePlanItemSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const existing = await getDeliverablePlan(projectId);
  const predecessorId =
    parsed.data.predecessor_id && parsed.data.predecessor_id !== ""
      ? parsed.data.predecessor_id
      : null;

  if (
    predecessorId &&
    wouldCreateCycle(
      existing.map((i) => ({ id: i.id, predecessor_id: i.predecessor_id })),
      itemId,
      predecessorId,
    )
  ) {
    return { ok: false, error: "Dependência circular — escolha outra etapa anterior." };
  }

  const supabase = await createSupabaseServerClient();
  const item = existing.find((i) => i.id === itemId);

  const { error } = await supabase
    .from("project_deliverable_plan_items")
    .update({
      name: parsed.data.name.trim(),
      deliverable_type: parsed.data.deliverable_type,
      estimated_days: parsed.data.estimated_days,
      professional_id:
        parsed.data.professional_id && parsed.data.professional_id !== ""
          ? parsed.data.professional_id
          : null,
      predecessor_id: predecessorId,
      notes: parsed.data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    console.error("[updateDeliverablePlanItem]", error);
    return { ok: false, error: "Não foi possível atualizar." };
  }

  if (item?.deliverable_id) {
    await supabase
      .from("deliverables")
      .update({ name: parsed.data.name.trim(), type: parsed.data.deliverable_type })
      .eq("id", item.deliverable_id);
  }

  revalidateProject(projectId);
  return { ok: true };
}

export async function deleteDeliverablePlanItem(
  itemId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: dependents } = await supabase
    .from("project_deliverable_plan_items")
    .select("id, name")
    .eq("predecessor_id", itemId);

  if (dependents?.length) {
    return {
      ok: false,
      error: `Remova a dependência primeiro: ${dependents.map((d) => d.name).join(", ")} depende deste item.`,
    };
  }

  const { error } = await supabase
    .from("project_deliverable_plan_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("[deleteDeliverablePlanItem]", error);
    return { ok: false, error: "Não foi possível excluir." };
  }

  revalidateProject(projectId);
  return { ok: true };
}

export async function updatePlanItemExecutionChecklist(
  itemId: string,
  projectId: string,
  checklist: ExecutionChecklistItem[],
): Promise<ActionResult> {
  const parsed = ExecutionChecklistSchema.safeParse(checklist);
  if (!parsed.success) {
    return { ok: false, error: "Checklist inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_deliverable_plan_items")
    .update({
      execution_checklist: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    console.error("[updatePlanItemExecutionChecklist]", error);
    return { ok: false, error: "Não foi possível salvar o checklist." };
  }

  revalidateProject(projectId);
  return { ok: true };
}

/** Preenche checklist sugerida só se a etapa ainda estiver vazia (não altera catálogo/Gantt). */
export async function seedPlanItemExecutionChecklist(
  itemId: string,
  projectId: string,
): Promise<ActionResult<{ checklist: ExecutionChecklistItem[] }>> {
  const plan = await getDeliverablePlan(projectId);
  const item = plan.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: "Etapa não encontrada." };
  if (item.execution_checklist.length > 0) {
    return { ok: true, data: { checklist: item.execution_checklist } };
  }

  const checklist = buildDefaultChecklist(item.name);
  if (checklist.length === 0) {
    return { ok: false, error: "Não há checklist sugerida para esta etapa." };
  }

  const result = await updatePlanItemExecutionChecklist(
    itemId,
    projectId,
    checklist,
  );
  if (!result.ok) return result;
  return { ok: true, data: { checklist } };
}

function topoSortPlan(items: DeliverablePlanItem[]): DeliverablePlanItem[] | null {
  const byId = new Map(items.map((i) => [i.id, i]));
  const inDegree = new Map<string, number>();
  for (const i of items) inDegree.set(i.id, 0);
  for (const i of items) {
    if (i.predecessor_id && byId.has(i.predecessor_id)) {
      inDegree.set(i.id, (inDegree.get(i.id) ?? 0) + 1);
    }
  }
  const queue = items
    .filter((i) => (inDegree.get(i.id) ?? 0) === 0)
    .sort((a, b) => a.sort_order - b.sort_order);
  const sorted: DeliverablePlanItem[] = [];
  const remaining = new Map(inDegree);

  while (queue.length) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const other of items) {
      if (other.predecessor_id === node.id) {
        const deg = (remaining.get(other.id) ?? 1) - 1;
        remaining.set(other.id, deg);
        if (deg === 0) queue.push(other);
      }
    }
    queue.sort((a, b) => a.sort_order - b.sort_order);
  }

  return sorted.length === items.length ? sorted : null;
}

export async function publishDeliverablePlanToSchedule(
  projectId: string,
  replaceExisting = false,
): Promise<ActionResult<{ activities: number }>> {
  const supabase = await createSupabaseServerClient();
  const items = await getDeliverablePlan(projectId);

  if (items.length === 0) {
    return { ok: false, error: "Cadastre pelo menos um entregável no plano." };
  }

  const sorted = topoSortPlan(items);
  if (!sorted) {
    return {
      ok: false,
      error: "Dependências inválidas ou ciclo detectado. Revise as etapas anteriores.",
    };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("start_date")
    .eq("id", projectId)
    .single();

  const anchor = project?.start_date ?? format(new Date(), "yyyy-MM-dd");

  const { count: existing } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((existing ?? 0) > 0 && !replaceExisting) {
    return {
      ok: false,
      error:
        "O cronograma já tem atividades. Exclua-as ou marque substituir ao publicar.",
    };
  }

  if (replaceExisting && (existing ?? 0) > 0) {
    await supabase.from("activities").delete().eq("project_id", projectId);
    await supabase
      .from("project_deliverable_plan_items")
      .update({ activity_id: null })
      .eq("project_id", projectId);
  }

  const endByPlanId = new Map<string, string>();
  const activityByPlanId = new Map<string, string>();
  let sortOrder = 0;

  for (const item of sorted) {
    let startCursor = parseISO(anchor);
    if (item.predecessor_id && endByPlanId.has(item.predecessor_id)) {
      startCursor = addDays(parseISO(endByPlanId.get(item.predecessor_id)!), 1);
    }

    const duration = Math.max(item.estimated_days, 1);
    const plannedStart = format(startCursor, "yyyy-MM-dd");
    const plannedEnd = format(addDays(startCursor, duration - 1), "yyyy-MM-dd");

    const { data: activity, error: actErr } = await supabase
      .from("activities")
      .insert({
        project_id: projectId,
        name: item.name,
        phase: "production",
        kind: "activity",
        estimated_duration_days: duration,
        planned_start_date: plannedStart,
        planned_end_date: plannedEnd,
        status: "not_started",
        visible_to_client: false,
        sort_order: sortOrder++,
      })
      .select("id")
      .single();

    if (actErr || !activity) {
      console.error("[publishDeliverablePlan]", actErr);
      return { ok: false, error: "Erro ao criar atividade no cronograma." };
    }

    endByPlanId.set(item.id, plannedEnd);
    activityByPlanId.set(item.id, activity.id);

    if (item.predecessor_id && activityByPlanId.has(item.predecessor_id)) {
      await supabase.from("activity_dependencies").insert({
        activity_id: activity.id,
        predecessor_id: activityByPlanId.get(item.predecessor_id)!,
        dependency_type: "FS",
        lag_days: 0,
      });
    }

    if (item.deliverable_id) {
      await supabase
        .from("deliverables")
        .update({ activity_id: activity.id })
        .eq("id", item.deliverable_id);
    }

    await supabase
      .from("project_deliverable_plan_items")
      .update({
        activity_id: activity.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  await supabase.rpc("recalculate_project_schedule", { p_project_id: projectId });

  revalidateProject(projectId);
  return { ok: true, data: { activities: sorted.length } };
}
