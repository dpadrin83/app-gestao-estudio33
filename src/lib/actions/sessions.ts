"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  TimeSessionEditSchema,
  type TimeSessionEditValues,
} from "@/lib/schemas/session";
import { revalidatePath } from "next/cache";
import type { ActiveSession, TimeSession } from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Retorna a sessão ativa (ended_at = null), se houver.
 * Inclui dados do projeto pra mostrar contexto.
 */
export async function getActiveSession(): Promise<ActiveSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("time_sessions")
    .select("*, project:projects(id, name, client_id)")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getActiveSession]", error);
    return null;
  }
  return data as ActiveSession | null;
}

/**
 * Lista sessões de um projeto, mais recentes primeiro.
 */
export async function listSessions(projectId: string): Promise<TimeSession[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("time_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false });
  if (error) {
    console.error("[listSessions]", error);
    return [];
  }
  return data ?? [];
}

/**
 * Inicia uma sessão. Se já houver outra ativa, encerra com now() antes.
 */
export async function startSession(
  projectId: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();

  // 1. encerra qualquer sessão ativa
  const now = new Date().toISOString();
  const { error: closeError } = await supabase
    .from("time_sessions")
    .update({ ended_at: now })
    .is("ended_at", null);
  if (closeError) {
    console.error("[startSession.close]", closeError);
    return { ok: false, error: closeError.message };
  }

  // 2. cria nova
  const { data, error } = await supabase
    .from("time_sessions")
    .insert({
      project_id: projectId,
      started_at: now,
      ended_at: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[startSession.insert]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

/**
 * Encerra a sessão ativa do projeto. Aceita descrição opcional.
 */
export async function stopActiveSession(
  projectId: string,
  description?: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("time_sessions")
    .update({ ended_at: now, description: description?.trim() || null })
    .eq("project_id", projectId)
    .is("ended_at", null);

  if (error) {
    console.error("[stopActiveSession]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Atualiza uma sessão (correções de horário/descrição).
 * Aceita started_at obrigatório, ended_at opcional, description opcional.
 */
export async function updateSession(
  id: string,
  values: TimeSessionEditValues,
  projectId: string,
): Promise<ActionResult> {
  const parsed = TimeSessionEditSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const startedAt = new Date(parsed.data.started_at);
  if (isNaN(startedAt.getTime())) {
    return { ok: false, error: "Data de início inválida." };
  }
  let endedAt: string | null = null;
  if (parsed.data.ended_at) {
    const e = new Date(parsed.data.ended_at);
    if (isNaN(e.getTime())) {
      return { ok: false, error: "Data de fim inválida." };
    }
    if (e.getTime() < startedAt.getTime()) {
      return { ok: false, error: "Fim precisa ser depois do início." };
    }
    endedAt = e.toISOString();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("time_sessions")
    .update({
      started_at: startedAt.toISOString(),
      ended_at: endedAt,
      description: parsed.data.description?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateSession]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteSession(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("time_sessions").delete().eq("id", id);
  if (error) {
    console.error("[deleteSession]", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
