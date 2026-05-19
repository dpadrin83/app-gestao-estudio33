"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TaskSchema, type TaskFormValues, taskStatusEnum } from "@/lib/schemas/task";
import type { Task, TaskStatus, TaskWithActivity } from "@/types/database";
import type { ActionResult } from "@/lib/actions/projects";

export async function listTasksByProject(
  projectId: string,
): Promise<TaskWithActivity[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, activity:activities(id, name)")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at");

  if (error) {
    console.error("[listTasksByProject]", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const raw = row.activity as unknown;
    let activity: TaskWithActivity["activity"] = null;
    if (raw && typeof raw === "object") {
      if (Array.isArray(raw)) {
        activity = (raw[0] as { id: string; name: string }) ?? null;
      } else {
        activity = raw as { id: string; name: string };
      }
    }
    const { activity: _a, ...task } = row as Task & { activity?: unknown };
    return { ...task, activity } as TaskWithActivity;
  });
}

export async function createTask(
  projectId: string,
  values: TaskFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = TaskSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", parsed.data.status);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      status: parsed.data.status,
      activity_id:
        parsed.data.activity_id && parsed.data.activity_id !== ""
          ? parsed.data.activity_id
          : null,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createTask]", error);
    return { ok: false, error: "Não foi possível criar a tarefa." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, data: { id: data.id } };
}

export async function updateTask(
  id: string,
  projectId: string,
  values: Partial<TaskFormValues>,
): Promise<ActionResult> {
  const patch: Record<string, unknown> = {};
  if (values.title != null) {
    const t = values.title.trim();
    if (!t) return { ok: false, error: "Título obrigatório." };
    patch.title = t;
  }
  if (values.description !== undefined) {
    patch.description = values.description?.trim() || null;
  }
  if (values.activity_id !== undefined) {
    patch.activity_id = values.activity_id ?? null;
  }
  if (values.status != null) {
    const s = taskStatusEnum.safeParse(values.status);
    if (!s.success) return { ok: false, error: "Status inválido." };
    patch.status = s.data;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) {
    console.error("[updateTask]", error);
    return { ok: false, error: "Não foi possível atualizar a tarefa." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function moveTaskStatus(
  id: string,
  projectId: string,
  status: TaskStatus,
): Promise<ActionResult> {
  return updateTask(id, projectId, { status });
}

export async function deleteTask(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("[deleteTask]", error);
    return { ok: false, error: "Não foi possível excluir a tarefa." };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
