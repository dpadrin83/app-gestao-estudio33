"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireHubAdmin } from "@/lib/auth/require-admin";
import { getAppUrl } from "@/lib/app-url";
import { emailPortalInvite } from "@/lib/email/notify";
import { isResendConfigured } from "@/lib/email/resend";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function inviteClientToPortal(
  clientId: string,
): Promise<ActionResult<{ email: string }>> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  const supabase = await createSupabaseServerClient();
  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id, name, email, auth_user_id")
    .eq("id", clientId)
    .single();

  if (fetchError || !client) {
    return { ok: false, error: "Cliente não encontrado." };
  }

  const email = client.email?.trim().toLowerCase();
  if (!email) {
    return {
      ok: false,
      error: "Cadastre o e-mail do contato principal antes de convidar.",
    };
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    };
  }

  const redirectTo = `${getAppUrl()}/auth/callback?next=/portal`;
  const linkType = client.auth_user_id ? "magiclink" : "invite";

  const { data, error } = await admin.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  });

  if (error) {
    console.error("[inviteClientToPortal]", error);
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return {
        ok: false,
        error:
          "Este e-mail já tem conta no Auth. Use “Redefinir acesso” ou vincule o UUID manualmente.",
      };
    }
    return { ok: false, error: error.message || "Não foi possível gerar o convite." };
  }

  const userId = data.user?.id;
  const actionLink = data.properties?.action_link;
  if (!userId || !actionLink) {
    return { ok: false, error: "Resposta inválida do Supabase Auth." };
  }

  if (!client.auth_user_id) {
    const { error: linkError } = await supabase
      .from("clients")
      .update({ auth_user_id: userId })
      .eq("id", clientId);

    if (linkError) {
      console.error("[inviteClientToPortal link]", linkError);
      return { ok: false, error: "Convite gerado, mas falhou ao vincular o cliente." };
    }
  }

  if (isResendConfigured()) {
    await emailPortalInvite({
      to: email,
      clientName: client.name,
      actionLink,
    });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");

  return {
    ok: true,
    data: {
      email,
    },
  };
}

export async function revokePortalAccess(
  clientId: string,
): Promise<ActionResult> {
  const guard = await requireHubAdmin();
  if (!guard.ok) return guard;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ auth_user_id: null })
    .eq("id", clientId);

  if (error) {
    console.error("[revokePortalAccess]", error);
    return { ok: false, error: "Não foi possível remover o acesso." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
