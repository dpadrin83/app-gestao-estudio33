"use server";

import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectSchema, type ProjectFormValues } from "@/lib/schemas/project";
import {
  QuickProjectSchema,
  type QuickProjectFormValues,
} from "@/lib/schemas/quick-project";
import { INTERNAL_PROJECTS_CLIENT_NAME } from "@/lib/projects/internal-client";
import {
  importCatalogGroupToProject,
  findCatalogGroupIdByName,
} from "@/lib/actions/deliverable-catalog";
import { publishDeliverablePlanToSchedule } from "@/lib/actions/deliverable-plan";
import { revalidatePath } from "next/cache";
import type {
  Project,
  ProjectStatus,
  ProjectWithClient,
} from "@/types/database";

const DIGITAL_CATALOG_AREA = "Soluções Digitais";

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

function emptyToNullDate(v: string | undefined): string | null {
  return v && v !== "" ? v : null;
}

function normalize(values: ProjectFormValues) {
  const cv = values.contract_value;
  const today = format(new Date(), "yyyy-MM-dd");
  let invoiced_at = emptyToNullDate(values.invoiced_at);
  let received_at = emptyToNullDate(values.received_at);

  if (values.payment_status === "invoiced" && !invoiced_at) {
    invoiced_at = today;
  }
  if (values.payment_status === "received") {
    if (!invoiced_at) invoiced_at = today;
    if (!received_at) received_at = today;
  }

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
    invoiced_at,
    received_at,
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

/** Cliente reservado para projetos internos / app pessoal até vincular cliente real. */
export async function ensureInternalProjectsClient(): Promise<
  ActionResult<{ id: string }>
> {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .ilike("name", INTERNAL_PROJECTS_CLIENT_NAME)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, data: { id: existing.id } };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: INTERNAL_PROJECTS_CLIENT_NAME,
      status: "active",
      notes:
        "Projetos internos, apps em desenvolvimento e testes. Troque o cliente na ficha do projeto quando fechar com um cliente real.",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ensureInternalProjectsClient]", error);
    return { ok: false, error: "Não foi possível preparar o cliente interno." };
  }

  revalidatePath("/clients");
  return { ok: true, data: { id: data.id } };
}

/** Cadastro mínimo: nome + opcionalmente catálogo digital e cronograma. */
export async function createProjectQuick(
  values: QuickProjectFormValues,
): Promise<
  ActionResult<{
    id: string;
    scheduleSteps?: number;
    usedInternalClient: boolean;
    warning?: string;
  }>
> {
  const parsed = QuickProjectSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const clientResult = await ensureInternalProjectsClient();
  if (!clientResult.ok) {
    return { ok: false, error: clientResult.error };
  }
  if (!clientResult.data?.id) {
    return { ok: false, error: "Cliente interno indisponível." };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const supabase = await createSupabaseServerClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientResult.data.id,
      name: parsed.data.name.trim(),
      description: "Projeto lançado em modo rápido. Vincule o cliente e ajuste dados quando puder.",
      status: "in_progress",
      start_date: today,
      service_line: parsed.data.service_line ?? "web_dev",
      payment_status: "to_invoice",
    })
    .select("id")
    .single();

  if (error || !project) {
    console.error("[createProjectQuick]", error);
    return { ok: false, error: "Não foi possível criar o projeto." };
  }

  let scheduleSteps: number | undefined;
  let warning: string | undefined;

  if (parsed.data.setup_digital_schedule !== false) {
    const groupId = await findCatalogGroupIdByName(DIGITAL_CATALOG_AREA);
    if (!groupId) {
      warning = `Catálogo "${DIGITAL_CATALOG_AREA}" não encontrado — importe manualmente no plano.`;
    } else {
      const imported = await importCatalogGroupToProject(project.id, groupId);
      if (!imported.ok) {
        warning = imported.error ?? "Falha ao importar o catálogo.";
      } else {
        const published = await publishDeliverablePlanToSchedule(project.id, false);
        if (!published.ok) {
          warning =
            published.error ?? "Plano importado, mas cronograma não foi publicado.";
        } else {
          scheduleSteps = published.data?.activities;
        }
      }
    }
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/schedule");

  return {
    ok: true,
    data: {
      id: project.id,
      scheduleSteps,
      usedInternalClient: true,
      warning,
    },
  };
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

