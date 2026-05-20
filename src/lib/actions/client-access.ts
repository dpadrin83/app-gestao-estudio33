"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ClientAccessSchema,
  type ClientAccessFormValues,
} from "@/lib/schemas/client-access";
import type { ClientAccess } from "@/types/database";
import type { ActionResult } from "@/lib/actions/projects";

function normalizeUrl(url: string | undefined) {
  const t = url?.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function rowFromForm(
  clientId: string,
  data: ClientAccessFormValues,
  existing?: Pick<ClientAccess, "password">,
): Omit<ClientAccess, "id" | "created_at" | "updated_at"> {
  const pwd = data.password?.trim();
  const due = data.next_due_date?.trim();

  return {
    client_id: clientId,
    kind: data.kind,
    label: data.label.trim(),
    login_url: normalizeUrl(data.login_url),
    username: data.username?.trim() || null,
    next_due_date: due || null,
    password: pwd ? pwd : (existing?.password ?? null),
    notes: data.notes?.trim() || null,
    is_active: data.is_active ?? true,
  };
}

export async function listClientAccess(clientId: string): Promise<ClientAccess[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_access")
    .select("*")
    .eq("client_id", clientId)
    .order("next_due_date", { ascending: true, nullsFirst: false })
    .order("kind", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("[listClientAccess]", error);
    return [];
  }
  return (data ?? []) as ClientAccess[];
}

export async function createClientAccess(
  clientId: string,
  values: ClientAccessFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ClientAccessSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_access")
    .insert(rowFromForm(clientId, parsed.data))
    .select("id")
    .single();

  if (error) {
    console.error("[createClientAccess]", error);
    return { ok: false, error: "Não foi possível cadastrar o acesso." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { ok: true, data: { id: data.id } };
}

export async function updateClientAccess(
  id: string,
  clientId: string,
  values: ClientAccessFormValues,
): Promise<ActionResult> {
  const parsed = ClientAccessSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("client_access")
    .select("password")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("client_access")
    .update({
      ...rowFromForm(clientId, parsed.data, {
        password: (current?.password as string | null) ?? null,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[updateClientAccess]", error);
    return { ok: false, error: "Não foi possível atualizar o acesso." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function deleteClientAccess(
  id: string,
  clientId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("client_access").delete().eq("id", id);
  if (error) {
    console.error("[deleteClientAccess]", error);
    return { ok: false, error: "Não foi possível excluir o acesso." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
