"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DeliverableSchema,
  DeliverableCommentSchema,
  type DeliverableFormValues,
  type DeliverableCommentFormValues,
} from "@/lib/schemas/deliverable";
import type {
  DeliverableWithVersions,
  DeliverableStatus,
} from "@/types/database";
import { emailDeliverableSent, emailDeliverableReviewed } from "@/lib/email/notify";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = String(item[key]);
    const list = map.get(k) ?? [];
    list.push(item);
    map.set(k, list);
  }
  return map;
}

export async function listDeliverablesByProject(
  projectId: string,
): Promise<DeliverableWithVersions[]> {
  const supabase = await createSupabaseServerClient();
  const { data: deliverables, error } = await supabase
    .from("deliverables")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listDeliverablesByProject]", error);
    return [];
  }
  if (!deliverables?.length) return [];

  const ids = deliverables.map((d) => d.id);
  const [versionsRes, commentsRes] = await Promise.all([
    supabase
      .from("deliverable_versions")
      .select("*")
      .in("deliverable_id", ids)
      .order("version_number", { ascending: false }),
    supabase
      .from("deliverable_comments")
      .select("*")
      .in("deliverable_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const versionsByDel = groupBy(versionsRes.data ?? [], "deliverable_id");
  const commentsByDel = groupBy(commentsRes.data ?? [], "deliverable_id");

  return deliverables.map((d) => ({
    ...d,
    versions: versionsByDel.get(d.id) ?? [],
    comments: commentsByDel.get(d.id) ?? [],
  })) as DeliverableWithVersions[];
}

export async function createDeliverable(
  projectId: string,
  values: DeliverableFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = DeliverableSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const link = parsed.data.external_link?.trim() || null;

  const { data: del, error } = await supabase
    .from("deliverables")
    .insert({
      project_id: projectId,
      name: parsed.data.name.trim(),
      type: parsed.data.type,
      activity_id:
        parsed.data.activity_id && parsed.data.activity_id !== ""
          ? parsed.data.activity_id
          : null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !del) {
    console.error("[createDeliverable]", error);
    return { ok: false, error: "Não foi possível criar o entregável." };
  }

  const { error: verError } = await supabase.from("deliverable_versions").insert({
    deliverable_id: del.id,
    version_number: 1,
    external_link: link,
    notes: parsed.data.notes?.trim() || null,
  });

  if (verError) {
    console.error("[createDeliverable version]", verError);
    return { ok: false, error: "Entregável criado, mas falhou ao salvar a versão." };
  }

  revalidatePaths(projectId);
  return { ok: true, data: { id: del.id } };
}

export async function addDeliverableVersion(
  deliverableId: string,
  projectId: string,
  values: DeliverableFormValues,
): Promise<ActionResult> {
  const parsed = DeliverableSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("deliverable_versions")
    .select("id", { count: "exact", head: true })
    .eq("deliverable_id", deliverableId);

  const nextVersion = (count ?? 0) + 1;
  const link = parsed.data.external_link?.trim() || null;

  const { error } = await supabase.from("deliverable_versions").insert({
    deliverable_id: deliverableId,
    version_number: nextVersion,
    external_link: link,
    notes: parsed.data.notes?.trim() || null,
  });

  if (error) {
    console.error("[addDeliverableVersion]", error);
    return { ok: false, error: "Não foi possível adicionar a versão." };
  }

  await supabase
    .from("deliverables")
    .update({ status: "draft" })
    .eq("id", deliverableId);

  revalidatePaths(projectId);
  return { ok: true };
}

export async function updateDeliverableActivity(
  deliverableId: string,
  projectId: string,
  activityId: string | null,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("deliverables")
    .update({ activity_id: activityId })
    .eq("id", deliverableId);

  if (error) {
    console.error("[updateDeliverableActivity]", error);
    return { ok: false, error: "Não foi possível vincular ao cronograma." };
  }

  revalidatePaths(projectId);
  return { ok: true };
}

export async function updateDeliverableStatus(
  deliverableId: string,
  projectId: string,
  status: DeliverableStatus,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("deliverables")
    .update({ status })
    .eq("id", deliverableId);

  if (error) {
    console.error("[updateDeliverableStatus]", error);
    return { ok: false, error: "Não foi possível atualizar o status." };
  }

  if (status === "sent_to_client") {
    void notifyDeliverableSent(supabase, deliverableId, projectId);
  }

  revalidatePaths(projectId);
  return { ok: true };
}

async function notifyDeliverableSent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  deliverableId: string,
  projectId: string,
) {
  const { data: row } = await supabase
    .from("deliverables")
    .select(
      "name, project:projects(id, name, client:clients(name, email))",
    )
    .eq("id", deliverableId)
    .single();

  const project = row?.project as
    | {
        id: string;
        name: string;
        client: { name: string; email: string | null } | null;
      }
    | null
    | undefined;

  const email = project?.client?.email?.trim();
  if (!email || !row?.name || !project?.name) return;

  await emailDeliverableSent({
    to: email,
    clientName: project.client?.name ?? "Cliente",
    projectName: project.name,
    deliverableName: row.name,
    projectId,
  });
}

export async function deleteDeliverable(
  deliverableId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("deliverables").delete().eq("id", deliverableId);
  if (error) {
    console.error("[deleteDeliverable]", error);
    return { ok: false, error: "Não foi possível excluir." };
  }
  revalidatePaths(projectId);
  return { ok: true };
}

/** Cliente: aprovar ou reprovar entregável enviado */
export async function clientReviewDeliverable(
  deliverableId: string,
  projectId: string,
  decision: "approved" | "rejected",
  values: DeliverableCommentFormValues,
): Promise<ActionResult> {
  const parsed = DeliverableCommentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Comentário obrigatório." };
  }

  const supabase = await createSupabaseServerClient();
  const { error: commentError } = await supabase.from("deliverable_comments").insert({
    deliverable_id: deliverableId,
    author_role: "client",
    body: parsed.data.body.trim(),
  });

  if (commentError) {
    console.error("[clientReviewDeliverable comment]", commentError);
    return { ok: false, error: "Não foi possível salvar o comentário." };
  }

  const { error } = await supabase
    .from("deliverables")
    .update({ status: decision })
    .eq("id", deliverableId);

  if (error) {
    console.error("[clientReviewDeliverable]", error);
    return { ok: false, error: "Não foi possível registrar sua decisão." };
  }

  void notifyDeliverableReviewed(supabase, deliverableId, projectId, decision);

  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
  return { ok: true };
}

async function notifyDeliverableReviewed(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  deliverableId: string,
  projectId: string,
  decision: "approved" | "rejected",
) {
  const { data: row } = await supabase
    .from("deliverables")
    .select(
      "name, project:projects(name, client:clients(name))",
    )
    .eq("id", deliverableId)
    .single();

  const project = row?.project as
    | { name: string; client: { name: string } | null }
    | null
    | undefined;

  if (!row?.name || !project?.name) return;

  await emailDeliverableReviewed({
    clientName: project.client?.name ?? "Cliente",
    projectName: project.name,
    deliverableName: row.name,
    decision,
    projectId,
  });
}

export async function listPendingDeliverablesForAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id, name, status, project:projects(id, name)")
    .eq("status", "sent_to_client")
    .order("updated_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

function revalidatePaths(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
  revalidatePath("/dashboard");
}
