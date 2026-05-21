"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHourlyRate } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/projects";

const DEFAULT_MARGIN_ALERT = 20;

export async function getAppHourlyRate(): Promise<number> {
  return getHourlyRate();
}

export async function getMarginAlertPercent(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "margin_alert_percent")
    .maybeSingle();

  const v = data?.value;
  if (typeof v === "number" && v >= 0 && v <= 100) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  }
  return DEFAULT_MARGIN_ALERT;
}

export async function updateMarginAlertPercent(
  value: number,
): Promise<ActionResult> {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { ok: false, error: "Use um percentual entre 0 e 100." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("app_settings").upsert({
    key: "margin_alert_percent",
    value,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[updateMarginAlertPercent]", error);
    return { ok: false, error: "Não foi possível salvar o alerta de margem." };
  }

  revalidatePath("/settings");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
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
