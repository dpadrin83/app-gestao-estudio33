"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ProjectLinkSchema,
  type ProjectLinkFormValues,
} from "@/lib/schemas/project-link";
import type { ProjectLink } from "@/types/database";
import type { ActionResult } from "@/lib/actions/projects";

function normalizeUrl(url: string | undefined): string | null {
  const t = url?.trim() ?? "";
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export async function listProjectLinks(projectId: string): Promise<ProjectLink[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_links")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listProjectLinks]", error);
    return [];
  }
  return (data ?? []) as ProjectLink[];
}

export async function createProjectLink(
  projectId: string,
  values: ProjectLinkFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ProjectLinkSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_links")
    .insert({
      project_id: projectId,
      name: parsed.data.name.trim(),
      url: normalizeUrl(parsed.data.url),
      username: parsed.data.username?.trim() || null,
      secret_note: parsed.data.secret_note?.trim() || null,
      kind: parsed.data.kind,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createProjectLink]", error);
    return { ok: false, error: "Não foi possível adicionar o acesso." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, data: { id: data.id } };
}

export async function deleteProjectLink(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_links").delete().eq("id", id);
  if (error) {
    console.error("[deleteProjectLink]", error);
    return { ok: false, error: "Não foi possível excluir." };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
