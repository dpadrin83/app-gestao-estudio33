"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  StudioCashMovementSchema,
  type StudioCashMovementFormValues,
} from "@/lib/schemas/studio-cash-movement";
import type { ActionResult } from "@/lib/actions/projects";
import type { StudioCashMovement } from "@/types/database";

function revalidateFinance() {
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function listStudioCashMovements(
  limit = 30,
): Promise<StudioCashMovement[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_cash_movements")
    .select("*")
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listStudioCashMovements]", error);
    return [];
  }
  return (data ?? []) as StudioCashMovement[];
}

export async function createStudioCashMovement(
  values: StudioCashMovementFormValues,
): Promise<ActionResult> {
  const parsed = StudioCashMovementSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const amount = Number(parsed.data.amount.replace(",", "."));
  const projectId =
    parsed.data.project_id && parsed.data.project_id !== ""
      ? parsed.data.project_id
      : null;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("studio_cash_movements").insert({
    movement_type: parsed.data.movement_type,
    amount,
    occurred_at: parsed.data.occurred_at,
    description: parsed.data.description.trim(),
    category: parsed.data.category,
    project_id: projectId,
    notes: parsed.data.notes?.trim() || null,
  });

  if (error) {
    console.error("[createStudioCashMovement]", error);
    return { ok: false, error: "Não foi possível registrar o lançamento." };
  }

  revalidateFinance();
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function deleteStudioCashMovement(
  id: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("studio_cash_movements")
    .select("project_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("studio_cash_movements")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível excluir o lançamento." };
  }

  revalidateFinance();
  if (row?.project_id) revalidatePath(`/projects/${row.project_id}`);
  return { ok: true };
}
