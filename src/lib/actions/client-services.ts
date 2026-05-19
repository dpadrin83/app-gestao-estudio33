"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ClientServiceSchema,
  parseClientServiceAmount,
  type ClientServiceFormValues,
} from "@/lib/schemas/client-service";
import type {
  ClientService,
  ClientServiceWithClient,
} from "@/types/database";
import type { ActionResult } from "@/lib/actions/projects";

function normalizePanelUrl(url: string | undefined) {
  const t = url?.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function rowFromForm(
  clientId: string,
  data: ClientServiceFormValues,
): Omit<ClientService, "id" | "created_at" | "updated_at"> {
  return {
    client_id: clientId,
    kind: data.kind,
    name: data.name.trim(),
    provider: data.provider?.trim() || null,
    next_due_date: data.next_due_date,
    billing_cycle: data.billing_cycle,
    amount: parseClientServiceAmount(data.amount),
    currency: "BRL",
    panel_url: normalizePanelUrl(data.panel_url),
    notes: data.notes?.trim() || null,
    is_active: data.is_active ?? true,
  };
}

export async function listClientServices(
  clientId: string,
): Promise<ClientService[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_services")
    .select("*")
    .eq("client_id", clientId)
    .order("next_due_date", { ascending: true });

  if (error) {
    console.error("[listClientServices]", error);
    return [];
  }
  return (data ?? []) as ClientService[];
}

export async function listAllClientServices(): Promise<ClientServiceWithClient[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_services")
    .select("*, client:clients(id, name)")
    .eq("is_active", true)
    .order("next_due_date", { ascending: true });

  if (error) {
    console.error("[listAllClientServices]", error);
    return [];
  }
  return (data ?? []) as ClientServiceWithClient[];
}

export async function createClientService(
  clientId: string,
  values: ClientServiceFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ClientServiceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_services")
    .insert(rowFromForm(clientId, parsed.data))
    .select("id")
    .single();

  if (error) {
    console.error("[createClientService]", error);
    return { ok: false, error: "Não foi possível cadastrar o serviço." };
  }

  revalidateClientServicePaths(clientId);
  return { ok: true, data: { id: data.id } };
}

export async function updateClientService(
  id: string,
  clientId: string,
  values: ClientServiceFormValues,
): Promise<ActionResult> {
  const parsed = ClientServiceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("client_services")
    .update({
      ...rowFromForm(clientId, parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[updateClientService]", error);
    return { ok: false, error: "Não foi possível atualizar o serviço." };
  }

  revalidateClientServicePaths(clientId);
  return { ok: true };
}

export async function deleteClientService(
  id: string,
  clientId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("client_services").delete().eq("id", id);
  if (error) {
    console.error("[deleteClientService]", error);
    return { ok: false, error: "Não foi possível excluir o serviço." };
  }

  revalidateClientServicePaths(clientId);
  return { ok: true };
}

function revalidateClientServicePaths(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/services");
  revalidatePath("/dashboard");
}
