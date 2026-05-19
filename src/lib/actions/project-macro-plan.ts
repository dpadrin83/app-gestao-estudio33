"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  MacroAreaSchema,
  WorkItemSchema,
  type MacroAreaFormValues,
  type WorkItemFormValues,
} from "@/lib/schemas/project-macro-plan";
import type {
  ProjectMacroPlan,
  ProjectMacroAreaWithItems,
  ProjectWorkItemWithRelations,
  StudioProfessional,
} from "@/types/database";
import type { ActionResult } from "@/lib/actions/deliverables";

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
}

export async function listStudioProfessionals(): Promise<StudioProfessional[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_professionals")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[listStudioProfessionals]", error);
    return [];
  }
  return (data ?? []) as StudioProfessional[];
}

export async function getProjectMacroPlan(
  projectId: string,
): Promise<ProjectMacroPlan> {
  const supabase = await createSupabaseServerClient();

  const [areasRes, itemsRes] = await Promise.all([
    supabase
      .from("project_macro_areas")
      .select(
        `
        *,
        professional:studio_professionals(id, name)
      `,
      )
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_work_items")
      .select(
        `
        *,
        professional:studio_professionals(id, name, slug),
        deliverable:deliverables(id, name, status)
      `,
      )
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
  ]);

  if (areasRes.error) console.error("[getProjectMacroPlan areas]", areasRes.error);
  if (itemsRes.error) console.error("[getProjectMacroPlan items]", itemsRes.error);

  const areas = (areasRes.data ?? []) as ProjectMacroAreaWithItems[];
  const allItems = (itemsRes.data ?? []) as ProjectWorkItemWithRelations[];

  const itemsByMacro = new Map<string, ProjectWorkItemWithRelations[]>();
  const orphanItems: ProjectWorkItemWithRelations[] = [];

  for (const item of allItems) {
    if (item.macro_area_id) {
      const list = itemsByMacro.get(item.macro_area_id) ?? [];
      list.push(item);
      itemsByMacro.set(item.macro_area_id, list);
    } else {
      orphanItems.push(item);
    }
  }

  for (const area of areas) {
    area.items = itemsByMacro.get(area.id) ?? [];
  }

  const totalDays = allItems.reduce((s, i) => s + i.estimated_days, 0);

  return { areas, orphanItems, totalDays };
}

async function nextMacroSort(projectId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("project_macro_areas")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  return count ?? 0;
}

async function nextItemSort(
  projectId: string,
  macroAreaId: string | null,
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("project_work_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (macroAreaId) {
    q = q.eq("macro_area_id", macroAreaId);
  } else {
    q = q.is("macro_area_id", null);
  }
  const { count } = await q;
  return count ?? 0;
}

export async function createMacroArea(
  projectId: string,
  values: MacroAreaFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = MacroAreaSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const sortOrder = await nextMacroSort(projectId);
  const profId =
    parsed.data.professional_id && parsed.data.professional_id !== ""
      ? parsed.data.professional_id
      : null;

  const { data, error } = await supabase
    .from("project_macro_areas")
    .insert({
      project_id: projectId,
      name: parsed.data.name.trim(),
      professional_id: profId,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createMacroArea]", error);
    return { ok: false, error: "Não foi possível criar a área macro." };
  }

  revalidateProject(projectId);
  return { ok: true, data: { id: data.id } };
}

export async function createWorkItem(
  projectId: string,
  values: WorkItemFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = WorkItemSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const macroId =
    parsed.data.macro_area_id && parsed.data.macro_area_id !== ""
      ? parsed.data.macro_area_id
      : null;
  const sortOrder = await nextItemSort(projectId, macroId);

  let deliverableId: string | null = null;

  if (parsed.data.item_type === "entregavel") {
    const { data: del, error: delErr } = await supabase
      .from("deliverables")
      .insert({
        project_id: projectId,
        name: parsed.data.name.trim(),
        type: "design",
        status: "draft",
      })
      .select("id")
      .single();

    if (delErr || !del) {
      console.error("[createWorkItem deliverable]", delErr);
      return { ok: false, error: "Não foi possível criar o entregável." };
    }

    deliverableId = del.id;

    await supabase.from("deliverable_versions").insert({
      deliverable_id: del.id,
      version_number: 1,
      external_link: null,
      notes: null,
    });
  }

  const { data, error } = await supabase
    .from("project_work_items")
    .insert({
      project_id: projectId,
      macro_area_id: macroId,
      item_type: parsed.data.item_type,
      name: parsed.data.name.trim(),
      professional_id: parsed.data.professional_id,
      estimated_days: parsed.data.estimated_days,
      deliverable_id: deliverableId,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createWorkItem]", error);
    return { ok: false, error: "Não foi possível salvar o item." };
  }

  revalidateProject(projectId);
  revalidatePath(`/portal/projects/${projectId}`);
  return { ok: true, data: { id: data.id } };
}

export async function updateWorkItemDays(
  itemId: string,
  projectId: string,
  estimatedDays: number,
): Promise<ActionResult> {
  if (!Number.isFinite(estimatedDays) || estimatedDays < 0) {
    return { ok: false, error: "Dias inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_work_items")
    .update({ estimated_days: Math.floor(estimatedDays), updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) {
    console.error("[updateWorkItemDays]", error);
    return { ok: false, error: "Não foi possível atualizar os dias." };
  }

  revalidateProject(projectId);
  return { ok: true };
}

export async function deleteMacroArea(
  areaId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_macro_areas")
    .delete()
    .eq("id", areaId);

  if (error) {
    console.error("[deleteMacroArea]", error);
    return { ok: false, error: "Não foi possível excluir a área macro." };
  }

  revalidateProject(projectId);
  return { ok: true };
}

export async function deleteWorkItem(
  itemId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: item } = await supabase
    .from("project_work_items")
    .select("deliverable_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("project_work_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("[deleteWorkItem]", error);
    return { ok: false, error: "Não foi possível excluir o item." };
  }

  if (item?.deliverable_id) {
    await supabase.from("deliverables").delete().eq("id", item.deliverable_id);
    revalidatePath(`/portal/projects/${projectId}`);
  }

  revalidateProject(projectId);
  return { ok: true };
}
