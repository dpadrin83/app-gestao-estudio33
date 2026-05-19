"use server";

import { addDays, format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActivitySchema, type ActivityFormValues } from "@/lib/schemas/activity";
import type {
  Activity,
  ActivityDependency,
  ActivityPhase,
  ActivityStatus,
  ActivityWithDeps,
  ActivityWithProject,
  ScheduleTemplate,
} from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function recalculateSchedule(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("recalculate_project_schedule", {
    p_project_id: projectId,
  });
  if (error) {
    console.error("[recalculate_project_schedule]", error);
  }
}

function syncStatusFromForm(
  status: ActivityFormValues["status"],
  plannedEnd: string,
  actualEnd?: string | null,
  opts?: { honorExplicitStatus?: boolean },
): ActivityFormValues["status"] {
  if (status === "completed" || actualEnd) return "completed";
  if (opts?.honorExplicitStatus) return status;
  const today = format(new Date(), "yyyy-MM-dd");
  if (
    plannedEnd < today &&
    (status === "not_started" || status === "in_progress")
  ) {
    return "delayed";
  }
  return status;
}

/** Recálculo forward só quando datas/duração/dependências mudam — não em status/portal. */
function shouldRecalculateSchedule(patch: ActivityPatch): boolean {
  return (
    patch.planned_start_date !== undefined ||
    patch.planned_end_date !== undefined ||
    patch.estimated_duration_days !== undefined
  );
}

function derivePlannedEnd(
  startIso: string,
  durationDays: number,
  kind: string,
): string {
  if (kind === "milestone") return startIso;
  const days = Math.max(durationDays, 1);
  return format(addDays(parseISO(startIso), days - 1), "yyyy-MM-dd");
}

function normalizeActivity(values: ActivityFormValues, projectId: string) {
  const duration =
    values.kind === "milestone"
      ? 0
      : Math.max(values.estimated_duration_days, 1);
  let plannedEnd = values.planned_end_date;
  const start = parseISO(values.planned_start_date);
  const minEnd = format(
    addDays(start, Math.max(duration, 1) - 1),
    "yyyy-MM-dd",
  );
  if (plannedEnd < minEnd) plannedEnd = minEnd;
  if (values.kind === "milestone") {
    plannedEnd = values.planned_start_date;
  }

  return {
    project_id: projectId,
    name: values.name.trim(),
    description: values.description?.trim() || null,
    phase: values.phase,
    kind: values.kind,
    status: syncStatusFromForm(values.status, plannedEnd, null, {
      honorExplicitStatus: true,
    }),
    estimated_duration_days: duration,
    planned_start_date: values.planned_start_date,
    planned_end_date: plannedEnd,
    visible_to_client: values.visible_to_client,
  };
}

/* ─── list ─── */

export async function listActivitiesByProject(
  projectId: string,
): Promise<ActivityWithDeps[]> {
  const supabase = await createSupabaseServerClient();

  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("planned_start_date");

  if (error) {
    console.error("[listActivitiesByProject]", error);
    return [];
  }

  const activityIds = (activities ?? []).map((a) => a.id);
  const { data: deps } =
    activityIds.length > 0
      ? await supabase
          .from("activity_dependencies")
          .select("*")
          .in("activity_id", activityIds)
      : { data: [] };

  const predIds = [...new Set((deps ?? []).map((d) => d.predecessor_id))];
  const { data: preds } =
    predIds.length > 0
      ? await supabase.from("activities").select("id, name").in("id", predIds)
      : { data: [] };
  const predMap = new Map((preds ?? []).map((p) => [p.id, p]));

  const depsByActivity = new Map<string, ActivityWithDeps["dependencies"]>();
  for (const d of deps ?? []) {
    const row = d as ActivityDependency;
    const pred = predMap.get(row.predecessor_id);
    if (!pred) continue;
    const list = depsByActivity.get(row.activity_id) ?? [];
    list.push({
      ...row,
      predecessor: { id: pred.id, name: pred.name },
    });
    depsByActivity.set(row.activity_id, list);
  }

  return (activities ?? []).map((a) => ({
    ...(a as Activity),
    dependencies: depsByActivity.get(a.id) ?? [],
  }));
}

export async function listActivitiesGlobal(opts?: {
  clientId?: string;
  projectStatus?: string[];
}): Promise<ActivityWithProject[]> {
  const supabase = await createSupabaseServerClient();

  let projectQuery = supabase
    .from("projects")
    .select("id, name, status, client:clients(id, name)");

  const statuses = opts?.projectStatus ?? ["in_progress"];
  projectQuery = projectQuery.in("status", statuses);

  if (opts?.clientId) {
    projectQuery = projectQuery.eq("client_id", opts.clientId);
  }

  const { data: projects } = await projectQuery;
  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return [];

  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .in("project_id", projectIds)
    .order("planned_start_date");

  if (error) {
    console.error("[listActivitiesGlobal]", error);
    return [];
  }

  const projectMap = new Map(
    (projects ?? []).map((p) => [p.id, p]),
  );

  return (activities ?? []).map((a) => {
    const p = projectMap.get(a.project_id)!;
    const client = p.client as unknown as { id: string; name: string };
    return {
      ...(a as Activity),
      project: {
        id: p.id,
        name: p.name,
        status: p.status,
        client: { id: client.id, name: client.name },
      },
    };
  });
}

export async function listScheduleTemplates(): Promise<ScheduleTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("schedule_templates")
    .select("*")
    .order("name");
  if (error) {
    console.error("[listScheduleTemplates]", error);
    return [];
  }
  return (data ?? []) as ScheduleTemplate[];
}

type RiskActivity = {
  id: string;
  name: string;
  planned_end_date: string;
  project: { id: string; name: string } | null;
};

export async function getActivityRiskSummary(): Promise<{
  delayed: RiskActivity[];
  dueSoon: RiskActivity[];
}> {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const in7 = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("status", "in_progress");

  const ids = (projects ?? []).map((p) => p.id);
  if (ids.length === 0) {
    return { delayed: [], dueSoon: [] };
  }

  const { data: delayed } = await supabase
    .from("activities")
    .select("id, name, planned_end_date, project:projects(id, name)")
    .in("project_id", ids)
    .neq("status", "completed")
    .lt("planned_end_date", today)
    .order("planned_end_date")
    .limit(8);

  const { data: dueSoon } = await supabase
    .from("activities")
    .select("id, name, planned_end_date, project:projects(id, name)")
    .in("project_id", ids)
    .neq("status", "completed")
    .gte("planned_end_date", today)
    .lte("planned_end_date", in7)
    .order("planned_end_date")
    .limit(8);

  const mapRow = (row: Record<string, unknown>): RiskActivity => {
    const raw = row.project;
    let project: RiskActivity["project"] = null;
    if (raw && typeof raw === "object") {
      if (Array.isArray(raw)) {
        project = (raw[0] as { id: string; name: string }) ?? null;
      } else {
        project = raw as { id: string; name: string };
      }
    }
    return {
      id: row.id as string,
      name: row.name as string,
      planned_end_date: row.planned_end_date as string,
      project,
    };
  };

  return {
    delayed: (delayed ?? []).map((r) => mapRow(r as Record<string, unknown>)),
    dueSoon: (dueSoon ?? []).map((r) => mapRow(r as Record<string, unknown>)),
  };
}

/* ─── mutations ─── */

export async function createActivity(
  projectId: string,
  values: ActivityFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ActivitySchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const payload = normalizeActivity(parsed.data, projectId);

  const { count } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data, error } = await supabase
    .from("activities")
    .insert({ ...payload, sort_order: count ?? 0 })
    .select("id")
    .single();

  if (error) {
    console.error("[createActivity]", error);
    return { ok: false, error: "Não foi possível criar a atividade." };
  }

  const predecessorIds = parsed.data.predecessor_ids ?? [];
  for (const predId of predecessorIds) {
    const depResult = await addActivityDependency(data.id, predId);
    if (!depResult.ok) return depResult;
  }

  await recalculateSchedule(projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

export type ActivityPatch = Partial<{
  status: ActivityStatus;
  phase: ActivityPhase;
  planned_start_date: string;
  planned_end_date: string;
  estimated_duration_days: number;
  visible_to_client: boolean;
}>;

function revalidateSchedulePaths(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/portal");
}

export async function patchActivity(
  id: string,
  projectId: string,
  patch: ActivityPatch,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) {
    return { ok: false, error: "Atividade não encontrada." };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const next: Record<string, unknown> = { ...patch };
  const kind = current.kind as string;

  if (patch.status === "completed") {
    next.status = "completed";
    next.actual_end_date = today;
    if (!current.actual_start_date) {
      next.actual_start_date = current.planned_start_date ?? today;
    }
  } else if (patch.status !== undefined) {
    next.actual_end_date = null;
  }

  const start =
    (patch.planned_start_date ?? current.planned_start_date) as string;
  let end = (patch.planned_end_date ?? current.planned_end_date) as string;

  if (patch.estimated_duration_days !== undefined && !patch.planned_end_date) {
    next.planned_end_date = derivePlannedEnd(
      start,
      patch.estimated_duration_days,
      kind,
    );
    end = next.planned_end_date as string;
  } else if (patch.planned_start_date && !patch.planned_end_date) {
    next.planned_end_date = derivePlannedEnd(
      start,
      (patch.estimated_duration_days ??
        current.estimated_duration_days) as number,
      kind,
    );
    end = next.planned_end_date as string;
  }

  if (
    patch.planned_end_date !== undefined ||
    patch.planned_start_date !== undefined ||
    patch.estimated_duration_days !== undefined
  ) {
    if (end < start) {
      return { ok: false, error: "A data de fim não pode ser antes do início." };
    }
    if (patch.status === undefined) {
      next.status = syncStatusFromForm(
        current.status as ActivityFormValues["status"],
        end,
        current.actual_end_date,
      );
    }
  }

  const { error } = await supabase.from("activities").update(next).eq("id", id);
  if (error) {
    console.error("[patchActivity]", error);
    return { ok: false, error: "Não foi possível atualizar." };
  }

  if (shouldRecalculateSchedule(patch)) {
    await recalculateSchedule(projectId);
  }
  revalidateSchedulePaths(projectId);
  return { ok: true };
}

export async function completeActivity(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  return patchActivity(id, projectId, { status: "completed" });
}

export async function completePhaseActivities(
  projectId: string,
  phase: ActivityPhase,
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: rows, error: fetchError } = await supabase
    .from("activities")
    .select("id, planned_start_date, actual_start_date")
    .eq("project_id", projectId)
    .eq("phase", phase)
    .neq("status", "completed");

  if (fetchError) {
    console.error("[completePhaseActivities]", fetchError);
    return { ok: false, error: "Não foi possível listar atividades da fase." };
  }

  if (!rows?.length) {
    return { ok: true, data: { count: 0 } };
  }

  for (const row of rows) {
    const { error } = await supabase
      .from("activities")
      .update({
        status: "completed",
        actual_end_date: today,
        actual_start_date: row.actual_start_date ?? row.planned_start_date ?? today,
      })
      .eq("id", row.id);
    if (error) {
      console.error("[completePhaseActivities update]", error);
      return { ok: false, error: "Erro ao concluir uma atividade da fase." };
    }
  }

  await recalculateSchedule(projectId);
  revalidateSchedulePaths(projectId);
  return { ok: true, data: { count: rows.length } };
}

export async function updateActivity(
  id: string,
  projectId: string,
  values: ActivityFormValues,
): Promise<ActionResult> {
  const parsed = ActivitySchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("activities")
    .select("planned_start_date, planned_end_date, estimated_duration_days")
    .eq("id", id)
    .single();

  const payload = normalizeActivity(parsed.data, projectId);

  const { error } = await supabase.from("activities").update(payload).eq("id", id);
  if (error) {
    console.error("[updateActivity]", error);
    return { ok: false, error: "Não foi possível atualizar a atividade." };
  }

  const dateChanged =
    !current ||
    payload.planned_start_date !== current.planned_start_date ||
    payload.planned_end_date !== current.planned_end_date ||
    payload.estimated_duration_days !== current.estimated_duration_days;

  if (dateChanged) {
    await recalculateSchedule(projectId);
  }
  revalidateSchedulePaths(projectId);
  return { ok: true };
}

export async function deleteActivity(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) {
    console.error("[deleteActivity]", error);
    return { ok: false, error: "Não foi possível excluir a atividade." };
  }
  await recalculateSchedule(projectId);
  revalidateSchedulePaths(projectId);
  return { ok: true };
}

export async function addActivityDependency(
  activityId: string,
  predecessorId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: acts } = await supabase
    .from("activities")
    .select("id, project_id")
    .in("id", [activityId, predecessorId]);

  if (!acts || acts.length !== 2) {
    return { ok: false, error: "Atividades não encontradas." };
  }
  const projectIds = new Set(acts.map((a) => a.project_id));
  if (projectIds.size !== 1) {
    return { ok: false, error: "Dependências só entre atividades do mesmo projeto." };
  }

  const projectId = acts[0]!.project_id;

  const { data: projectActs } = await supabase
    .from("activities")
    .select("id")
    .eq("project_id", projectId);
  const projectActIds = (projectActs ?? []).map((a) => a.id);

  const { data: allDeps } =
    projectActIds.length > 0
      ? await supabase
          .from("activity_dependencies")
          .select("activity_id, predecessor_id")
          .in("activity_id", projectActIds)
      : { data: [] };

  const graph = new Map<string, string[]>();
  for (const d of allDeps ?? []) {
    const list = graph.get(d.activity_id) ?? [];
    list.push(d.predecessor_id);
    graph.set(d.activity_id, list);
  }
  const pending = graph.get(activityId) ?? [];
  pending.push(predecessorId);
  graph.set(activityId, pending);

  if (wouldCreateCycle(graph, activityId, predecessorId)) {
    return { ok: false, error: "Essa dependência criaria um ciclo no cronograma." };
  }

  const { error } = await supabase.from("activity_dependencies").insert({
    activity_id: activityId,
    predecessor_id: predecessorId,
    dependency_type: "FS",
    lag_days: 0,
  });

  if (error) {
    console.error("[addActivityDependency]", error);
    return { ok: false, error: "Não foi possível adicionar a dependência." };
  }

  await recalculateSchedule(projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  return { ok: true };
}

function wouldCreateCycle(
  graph: Map<string, string[]>,
  start: string,
  target: string,
): boolean {
  const stack = [target];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === start) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const pred of graph.get(node) ?? []) {
      stack.push(pred);
    }
  }
  return false;
}

export async function applyScheduleTemplate(
  projectId: string,
  templateId: string,
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("start_date, service_line")
    .eq("id", projectId)
    .single();

  const { data: templateMeta } = await supabase
    .from("schedule_templates")
    .select("service_line")
    .eq("id", templateId)
    .single();

  const anchor =
    project?.start_date ?? format(new Date(), "yyyy-MM-dd");

  const { data: items, error: itemsError } = await supabase
    .from("schedule_template_items")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");

  if (itemsError || !items?.length) {
    return { ok: false, error: "Template não encontrado ou vazio." };
  }

  const { count: existing } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((existing ?? 0) > 0) {
    return {
      ok: false,
      error: "Este projeto já tem atividades. Exclua antes de aplicar um template.",
    };
  }

  const idBySort = new Map<number, string>();
  let cursor = parseISO(anchor);

  for (const item of items) {
    const duration =
      item.kind === "milestone"
        ? 0
        : Math.max(item.estimated_duration_days, 1);
    const plannedStart = format(cursor, "yyyy-MM-dd");
    const plannedEnd =
      item.kind === "milestone"
        ? plannedStart
        : format(addDays(cursor, duration - 1), "yyyy-MM-dd");

    const { data: created, error: createError } = await supabase
      .from("activities")
      .insert({
        project_id: projectId,
        name: item.name,
        phase: item.phase,
        kind: item.kind,
        estimated_duration_days: duration,
        planned_start_date: plannedStart,
        planned_end_date: plannedEnd,
        status: "not_started",
        visible_to_client: true,
        sort_order: item.sort_order,
      })
      .select("id")
      .single();

    if (createError || !created) {
      console.error("[applyScheduleTemplate]", createError);
      return { ok: false, error: "Erro ao gerar atividades do template." };
    }

    idBySort.set(item.sort_order, created.id);
    cursor = addDays(parseISO(plannedEnd), 1);
  }

  for (const item of items) {
    if (item.predecessor_sort_order == null) continue;
    const succId = idBySort.get(item.sort_order);
    const predId = idBySort.get(item.predecessor_sort_order);
    if (!succId || !predId) continue;

    await supabase.from("activity_dependencies").insert({
      activity_id: succId,
      predecessor_id: predId,
      dependency_type: "FS",
      lag_days: item.lag_days ?? 0,
    });
  }

  const { data: templateDeliverables } = await supabase
    .from("schedule_template_deliverables")
    .select("*")
    .eq("template_id", templateId)
    .order("activity_sort_order")
    .order("sort_order");

  if (templateMeta?.service_line && !project?.service_line) {
    await supabase
      .from("projects")
      .update({ service_line: templateMeta.service_line })
      .eq("id", projectId);
  }

  if (templateDeliverables?.length) {
    for (const td of templateDeliverables) {
      const activityId = idBySort.get(td.activity_sort_order) ?? null;
      const { data: del, error: delError } = await supabase
        .from("deliverables")
        .insert({
          project_id: projectId,
          name: td.name,
          type: td.type,
          activity_id: activityId,
          status: "draft",
        })
        .select("id")
        .single();

      if (delError || !del) {
        console.error("[applyScheduleTemplate deliverable]", delError);
        continue;
      }

      await supabase.from("deliverable_versions").insert({
        deliverable_id: del.id,
        version_number: 1,
        external_link: null,
        notes: "Gerado pelo plano de entregas do template.",
      });
    }
  }

  await recalculateSchedule(projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/portal");
  return { ok: true, data: { count: items.length } };
}
