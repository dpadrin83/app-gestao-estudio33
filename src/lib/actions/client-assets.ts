"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireHubAdmin } from "@/lib/auth/require-admin";

const BUCKET = "client-assets";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function uploadClientBrandAsset(
  clientId: string,
  field: "logo_url" | "portal_background_url",
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo de imagem." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Arquivo muito grande (máx. 5 MB)." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Use JPEG, PNG, WebP ou SVG." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const prefix = field === "logo_url" ? "logo" : "bg";
  const path = `${clientId}/${prefix}-${Date.now()}.${ext}`;

  const supabase = await createSupabaseServerClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[uploadClientBrandAsset]", uploadError);
    return {
      ok: false,
      error:
        uploadError.message.includes("Bucket not found")
          ? "Bucket client-assets não existe — rode a migration 20260520170000."
          : "Falha no upload.",
    };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updateError } = await supabase
    .from("clients")
    .update({ [field]: url })
    .eq("id", clientId);

  if (updateError) {
    console.error("[uploadClientBrandAsset update]", updateError);
    return { ok: false, error: "Upload ok, mas falhou ao salvar no cliente." };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portal");

  return { ok: true, data: { url } };
}
