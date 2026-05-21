"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireHubAdmin } from "@/lib/auth/require-admin";
import type { FinanceDocumentKind, ProjectFinanceDocument } from "@/types/database";
import type { ActionResult } from "@/lib/actions/projects";

const BUCKET = "project-finance-docs";
const MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const KINDS = new Set<FinanceDocumentKind>([
  "contract",
  "invoice",
  "receipt",
  "other",
]);

export async function listProjectFinanceDocuments(
  projectId: string,
): Promise<ProjectFinanceDocument[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_finance_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listProjectFinanceDocuments]", error);
    return [];
  }
  return (data ?? []) as ProjectFinanceDocument[];
}

export async function uploadProjectFinanceDocument(
  projectId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  const file = formData.get("file");
  const kindRaw = String(formData.get("kind") ?? "other");
  const title = String(formData.get("title") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo." };
  }
  if (!KINDS.has(kindRaw as FinanceDocumentKind)) {
    return { ok: false, error: "Tipo de documento inválido." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Arquivo muito grande (máx. 20 MB)." };
  }
  if (!ALLOWED.has(file.type)) {
    return {
      ok: false,
      error: "Formato não permitido. Use PDF, imagem, Word ou Excel.",
    };
  }

  const kind = kindRaw as FinanceDocumentKind;
  const supabase = await createSupabaseServerClient();
  const docId = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const storagePath = `${projectId}/${docId}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[uploadProjectFinanceDocument]", uploadError);
    return {
      ok: false,
      error: uploadError.message.includes("Bucket not found")
        ? "Bucket project-finance-docs não existe — rode a migration 20260521320000."
        : "Falha no upload.",
    };
  }

  const { data: row, error: insertError } = await supabase
    .from("project_finance_documents")
    .insert({
      id: docId,
      project_id: projectId,
      kind,
      title: title || safeName,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    })
    .select("id")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("[uploadProjectFinanceDocument insert]", insertError);
    return { ok: false, error: "Upload ok, mas falhou ao registrar o documento." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, data: { id: row.id } };
}

export async function deleteProjectFinanceDocument(
  docId: string,
  projectId: string,
): Promise<ActionResult> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  const supabase = await createSupabaseServerClient();
  const { data: doc } = await supabase
    .from("project_finance_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!doc) return { ok: false, error: "Documento não encontrado." };

  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error } = await supabase
    .from("project_finance_documents")
    .delete()
    .eq("id", docId);

  if (error) return { ok: false, error: "Não foi possível excluir o documento." };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function getProjectFinanceDocumentUrl(
  docId: string,
  projectId: string,
): Promise<ActionResult<{ url: string }>> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  const supabase = await createSupabaseServerClient();
  const { data: doc } = await supabase
    .from("project_finance_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!doc) return { ok: false, error: "Documento não encontrado." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 3600);

  if (error || !data?.signedUrl) {
    return { ok: false, error: "Não foi possível gerar o link de download." };
  }

  return { ok: true, data: { url: data.signedUrl } };
}
