"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DeliverableCatalogItemSchema,
  type DeliverableCatalogItemFormValues,
} from "@/lib/schemas/deliverable-catalog";
import type { DeliverableCatalogItem } from "@/types/database";
import type { ActionResult } from "@/lib/actions/deliverables";
import {
  createDeliverablePlanItem,
  getDeliverablePlan,
} from "@/lib/actions/deliverable-plan";
import type { DeliverablePlanItemFormValues } from "@/lib/schemas/deliverable-plan";

function revalidateCatalog() {
  revalidatePath("/catalog/deliverables");
}

export async function listDeliverableCatalog(opts?: {
  activeOnly?: boolean;
}): Promise<DeliverableCatalogItem[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("studio_deliverable_catalog")
    .select(`*, professional:studio_professionals(id, name)`)
    .order("sort_order", { ascending: true });

  if (opts?.activeOnly !== false) {
    q = q.eq("is_active", true);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[listDeliverableCatalog]", error);
    return [];
  }

  const rows = (data ?? []) as Omit<DeliverableCatalogItem, "predecessor">[];
  const nameById = new Map(rows.map((r) => [r.id, r.name]));

  return rows.map((row) => ({
    ...row,
    predecessor: row.predecessor_id
      ? { id: row.predecessor_id, name: nameById.get(row.predecessor_id) ?? "—" }
      : null,
  }));
}

async function nextCatalogSort(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("studio_deliverable_catalog")
    .select("id", { count: "exact", head: true });
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

export async function createDeliverableCatalogItem(
  values: DeliverableCatalogItemFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = DeliverableCatalogItemSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const existing = await listDeliverableCatalog({ activeOnly: false });
  const predecessorId =
    parsed.data.predecessor_id && parsed.data.predecessor_id !== ""
      ? parsed.data.predecessor_id
      : null;

  if (predecessorId && !existing.some((i) => i.id === predecessorId)) {
    return { ok: false, error: "Etapa anterior inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_deliverable_catalog")
    .insert({
      name: parsed.data.name.trim(),
      deliverable_type: parsed.data.deliverable_type,
      estimated_days: parsed.data.estimated_days,
      professional_id:
        parsed.data.professional_id && parsed.data.professional_id !== ""
          ? parsed.data.professional_id
          : null,
      predecessor_id: predecessorId,
      service_line: parsed.data.service_line || null,
      notes: parsed.data.notes?.trim() || null,
      is_active: parsed.data.is_active ?? true,
      sort_order: await nextCatalogSort(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createDeliverableCatalogItem]", error);
    return { ok: false, error: "Não foi possível salvar no catálogo." };
  }

  revalidateCatalog();
  return { ok: true, data: { id: data.id } };
}

export async function updateDeliverableCatalogItem(
  id: string,
  values: DeliverableCatalogItemFormValues,
): Promise<ActionResult> {
  const parsed = DeliverableCatalogItemSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const existing = await listDeliverableCatalog({ activeOnly: false });
  const predecessorId =
    parsed.data.predecessor_id && parsed.data.predecessor_id !== ""
      ? parsed.data.predecessor_id
      : null;

  if (
    predecessorId &&
    wouldCreateCycle(
      existing.map((i) => ({ id: i.id, predecessor_id: i.predecessor_id })),
      id,
      predecessorId,
    )
  ) {
    return { ok: false, error: "Dependência circular." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("studio_deliverable_catalog")
    .update({
      name: parsed.data.name.trim(),
      deliverable_type: parsed.data.deliverable_type,
      estimated_days: parsed.data.estimated_days,
      professional_id:
        parsed.data.professional_id && parsed.data.professional_id !== ""
          ? parsed.data.professional_id
          : null,
      predecessor_id: predecessorId,
      service_line: parsed.data.service_line || null,
      notes: parsed.data.notes?.trim() || null,
      is_active: parsed.data.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[updateDeliverableCatalogItem]", error);
    return { ok: false, error: "Não foi possível atualizar." };
  }

  revalidateCatalog();
  return { ok: true };
}

export async function deleteDeliverableCatalogItem(
  id: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: dependents } = await supabase
    .from("studio_deliverable_catalog")
    .select("id, name")
    .eq("predecessor_id", id);

  if (dependents?.length) {
    return {
      ok: false,
      error: `Outras etapas dependem desta: ${dependents.map((d) => d.name).join(", ")}`,
    };
  }

  const { error } = await supabase
    .from("studio_deliverable_catalog")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteDeliverableCatalogItem]", error);
    return { ok: false, error: "Não foi possível excluir." };
  }

  revalidateCatalog();
  return { ok: true };
}

function topoSortCatalog(
  items: DeliverableCatalogItem[],
): DeliverableCatalogItem[] | null {
  const inDegree = new Map<string, number>();
  for (const i of items) inDegree.set(i.id, 0);
  for (const i of items) {
    if (i.predecessor_id && items.some((x) => x.id === i.predecessor_id)) {
      inDegree.set(i.id, (inDegree.get(i.id) ?? 0) + 1);
    }
  }
  const queue = items
    .filter((i) => (inDegree.get(i.id) ?? 0) === 0)
    .sort((a, b) => a.sort_order - b.sort_order);
  const sorted: DeliverableCatalogItem[] = [];
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

function expandWithPredecessors(
  all: DeliverableCatalogItem[],
  selectedIds: string[],
): DeliverableCatalogItem[] {
  const byId = new Map(all.map((i) => [i.id, i]));
  const ids = new Set(selectedIds);
  for (const id of [...ids]) {
    let cur = byId.get(id)?.predecessor_id ?? null;
    while (cur && byId.has(cur)) {
      ids.add(cur);
      cur = byId.get(cur)?.predecessor_id ?? null;
    }
  }
  return all.filter((i) => ids.has(i.id));
}

/** Copia itens do catálogo para o plano do projeto (mantém dependências). */
export async function importCatalogToProject(
  projectId: string,
  catalogIds: string[],
  opts?: { replaceExisting?: boolean },
): Promise<ActionResult<{ count: number }>> {
  if (catalogIds.length === 0) {
    return { ok: false, error: "Selecione ao menos uma etapa do catálogo." };
  }

  const all = await listDeliverableCatalog({ activeOnly: true });
  const subset = expandWithPredecessors(all, catalogIds);
  const sorted = topoSortCatalog(subset);
  if (!sorted) {
    return { ok: false, error: "Dependências do catálogo inválidas." };
  }

  const existing = await getDeliverablePlan(projectId);
  if (existing.length > 0 && !opts?.replaceExisting) {
    return {
      ok: false,
      error:
        "O projeto já tem entregáveis no plano. Marque substituir ou apague antes.",
    };
  }

  if (opts?.replaceExisting && existing.length > 0) {
    const supabase = await createSupabaseServerClient();
    for (const item of existing) {
      if (item.deliverable_id) {
        await supabase.from("deliverables").delete().eq("id", item.deliverable_id);
      }
      await supabase
        .from("project_deliverable_plan_items")
        .delete()
        .eq("id", item.id);
    }
  }

  const catalogToPlan = new Map<string, string>();
  let count = 0;

  for (const cat of sorted) {
    const predPlanId = cat.predecessor_id
      ? catalogToPlan.get(cat.predecessor_id)
      : undefined;

    const values: DeliverablePlanItemFormValues = {
      name: cat.name,
      deliverable_type: cat.deliverable_type,
      estimated_days: cat.estimated_days,
      professional_id: cat.professional_id ?? "",
      predecessor_id: predPlanId ?? "",
      notes: cat.notes ?? "",
    };

    const result = await createDeliverablePlanItem(projectId, values);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }
    if (!result.data?.id) {
      return { ok: false, error: `Falha ao importar "${cat.name}".` };
    }
    catalogToPlan.set(cat.id, result.data.id);
    count++;
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, data: { count } };
}
