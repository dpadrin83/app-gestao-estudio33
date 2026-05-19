"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHourlyRate } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/projects";

export async function getAppHourlyRate(): Promise<number> {
  return getHourlyRate();
}

export async function updateHourlyRate(
  value: number,
): Promise<ActionResult> {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Informe um valor maior que zero." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("app_settings").upsert({
    key: "hourly_rate",
    value,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[updateHourlyRate]", error);
    return { ok: false, error: "Não foi possível salvar a taxa." };
  }

  revalidatePath("/settings");
  revalidatePath("/finance");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}
