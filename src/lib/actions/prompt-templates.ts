"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PromptTemplateSchema,
  type PromptTemplateFormValues,
} from "@/lib/schemas/prompt-template";
import { extractPromptVariables } from "@/lib/prompts/variables";
import { PromptImportBundleSchema } from "@/lib/schemas/prompt-import";
import { requireHubAdmin } from "@/lib/auth/require-admin";
import type { PromptTemplateWithProfessional } from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function revalidatePrompts() {
  revalidatePath("/settings/prompts");
  revalidatePath("/settings");
}

export async function listPromptTemplates(options?: {
  professionalId?: string;
  activeOnly?: boolean;
}): Promise<PromptTemplateWithProfessional[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("prompt_templates")
    .select(
      `
      *,
      professional:studio_professionals(id, name, slug, service_line)
    `,
    )
    .order("updated_at", { ascending: false });

  if (options?.professionalId) {
    q = q.eq("professional_id", options.professionalId);
  }
  if (options?.activeOnly !== false) {
    q = q.eq("is_active", true);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[listPromptTemplates]", error);
    return [];
  }
  return (data ?? []) as PromptTemplateWithProfessional[];
}

export async function createPromptTemplate(
  values: PromptTemplateFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = PromptTemplateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const variables = extractPromptVariables(parsed.data.body);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("prompt_templates")
    .insert({
      title: parsed.data.title.trim(),
      professional_id: parsed.data.professional_id,
      deliverable_hint: parsed.data.deliverable_hint?.trim() || null,
      body: parsed.data.body.trim(),
      variables,
      is_active: parsed.data.is_active ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createPromptTemplate]", error);
    return { ok: false, error: "Não foi possível salvar o prompt." };
  }

  revalidatePrompts();
  return { ok: true, data: { id: data.id } };
}

export async function updatePromptTemplate(
  id: string,
  values: PromptTemplateFormValues,
): Promise<ActionResult> {
  const parsed = PromptTemplateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const variables = extractPromptVariables(parsed.data.body);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("prompt_templates")
    .update({
      title: parsed.data.title.trim(),
      professional_id: parsed.data.professional_id,
      deliverable_hint: parsed.data.deliverable_hint?.trim() || null,
      body: parsed.data.body.trim(),
      variables,
      is_active: parsed.data.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[updatePromptTemplate]", error);
    return { ok: false, error: "Não foi possível atualizar o prompt." };
  }

  revalidatePrompts();
  return { ok: true };
}

export async function deletePromptTemplate(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("prompt_templates").delete().eq("id", id);

  if (error) {
    console.error("[deletePromptTemplate]", error);
    return { ok: false, error: "Não foi possível excluir o prompt." };
  }

  revalidatePrompts();
  return { ok: true };
}

export async function duplicatePromptTemplate(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: src, error: fetchErr } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !src) {
    return { ok: false, error: "Prompt não encontrado." };
  }

  const { data, error } = await supabase
    .from("prompt_templates")
    .insert({
      professional_id: src.professional_id,
      title: `${src.title} (cópia)`,
      deliverable_hint: src.deliverable_hint,
      body: src.body,
      variables: src.variables,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[duplicatePromptTemplate]", error);
    return { ok: false, error: "Não foi possível duplicar." };
  }

  revalidatePrompts();
  return { ok: true, data: { id: data.id } };
}

export async function importPromptTemplates(
  jsonText: string,
): Promise<
  ActionResult<{ imported: number; skipped: number; errors: string[] }>
> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSON inválido. Verifique vírgulas e aspas." };
  }

  const bundle = PromptImportBundleSchema.safeParse(parsed);
  if (!bundle.success) {
    return {
      ok: false,
      error:
        bundle.error.issues[0]?.message ??
        'Formato inválido. Use { "prompts": [ { "professional_slug", "title", "body" } ] }.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: pros, error: prosErr } = await supabase
    .from("studio_professionals")
    .select("id, slug");

  if (prosErr || !pros?.length) {
    return {
      ok: false,
      error:
        "Profissionais E33 não encontrados. Rode a migration 20260520120000_prompt_templates.sql.",
    };
  }

  const slugToId = new Map(pros.map((p) => [p.slug, p.id]));
  const rows: Array<{
    professional_id: string;
    title: string;
    deliverable_hint: string | null;
    body: string;
    variables: string[];
    is_active: boolean;
  }> = [];
  const errors: string[] = [];

  for (let i = 0; i < bundle.data.prompts.length; i++) {
    const item = bundle.data.prompts[i];
    const profId = slugToId.get(item.professional_slug);
    if (!profId) {
      errors.push(`Linha ${i + 1}: slug "${item.professional_slug}" desconhecido.`);
      continue;
    }
    rows.push({
      professional_id: profId,
      title: item.title.trim(),
      deliverable_hint: item.deliverable_hint?.trim() || null,
      body: item.body.trim(),
      variables: extractPromptVariables(item.body),
      is_active: item.is_active ?? true,
    });
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error: errors[0] ?? "Nenhum prompt válido para importar.",
    };
  }

  const { error } = await supabase.from("prompt_templates").insert(rows);
  if (error) {
    console.error("[importPromptTemplates]", error);
    return { ok: false, error: "Falha ao gravar no banco." };
  }

  revalidatePrompts();
  return {
    ok: true,
    data: {
      imported: rows.length,
      skipped: bundle.data.prompts.length - rows.length,
      errors,
    },
  };
}

export async function exportPromptTemplatesJson(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("prompt_templates")
    .select(
      "title, deliverable_hint, body, is_active, professional:studio_professionals(slug)",
    )
    .order("title");

  const prompts = (data ?? []).map((row) => {
    const prof = row.professional as { slug: string } | { slug: string }[] | null;
    const slug = Array.isArray(prof) ? prof[0]?.slug : prof?.slug;
    return {
      professional_slug: slug ?? "pm-orquestrador",
      title: row.title,
      deliverable_hint: row.deliverable_hint,
      body: row.body,
      is_active: row.is_active,
    };
  });

  return JSON.stringify({ prompts }, null, 2);
}
