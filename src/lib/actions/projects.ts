"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectSchema, type ProjectFormValues } from "@/lib/schemas/project";
import { revalidatePath } from "next/cache";
import type {
  Project,
  ProjectStatus,
  ProjectWithClient,
} from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/* ─── list ─── */

export async function listProjects(opts?: {
  status?: ProjectStatus[];
  clientId?: string;
}): Promise<ProjectWithClient[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("projects")
    .select("*, client:clients(id, name, status)")
    .order("created_at", { ascending: false });

  if (opts?.status && opts.status.length > 0) {
    query = query.in("status", opts.status);
  }
  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[listProjects]", error);
    return [];
  }
  return (data ?? []) as ProjectWithClient[];
}

export async function getProject(id: string): Promise<ProjectWithClient | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(id, name, status)")
    .eq("id", id)
    .single();
  if (error) {
    console.error("[getProject]", error);
    return null;
  }
  return data as ProjectWithClient;
}

/* ─── create / update ─── */

function normalize(values: ProjectFormValues) {
  const cv = values.contract_value;
  return {
    client_id: values.client_id,
    name: values.name.trim(),
    description: values.description?.trim() || null,
    briefing_notes: values.briefing_notes?.trim() || null,
    status: values.status,
    start_date: values.start_date && values.start_date !== "" ? values.start_date : null,
    expected_end_date:
      values.expected_end_date && values.expected_end_date !== ""
        ? values.expected_end_date
        : null,
    contract_value:
      !cv || cv === "" ? null : Number(cv.replace(",", ".")),
    payment_status: values.payment_status,
    service_line: !values.service_line ? null : values.service_line,
  };
}

export async function listProjectsByClient(
  clientId: string,
): Promise<ProjectWithClient[]> {
  return listProjects({ clientId });
}

export async function createProject(
  values: ProjectFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ProjectSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(normalize(parsed.data))
    .select("id")
    .single();

  if (error) {
    console.error("[createProject]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

export async function updateProject(
  id: string,
  values: ProjectFormValues,
): Promise<ActionResult> {
  const parsed = ProjectSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("[updateProject]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/finance");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: openSession } = await supabase
    .from("time_sessions")
    .select("id")
    .eq("project_id", id)
    .is("ended_at", null)
    .maybeSingle();

  if (openSession) {
    return {
      ok: false,
      error: "Encerre o timer deste projeto antes de excluir.",
    };
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("[deleteProject]", error);
    return {
      ok: false,
      error: "Não foi possível excluir o projeto. Tente novamente.",
    };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/finance");
  revalidatePath("/clients");
  return { ok: true };
}

/* ─── lookup auxiliar ─── */

export async function listActiveClients(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .in("status", ["active", "prospect", "paused"])
    .order("name");
  if (error) {
    console.error("[listActiveClients]", error);
    return [];
  }
  return data ?? [];
}

