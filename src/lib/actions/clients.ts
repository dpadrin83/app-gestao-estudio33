"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ClientSchema,
  normalizeClientForm,
  type ClientFormValues,
} from "@/lib/schemas/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Client, ClientStatus } from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export type ClientListFilter =
  | "operational"
  | "prospect"
  | "active"
  | "paused"
  | "closed"
  | "inactive"
  | "all";

const OPERATIONAL_STATUSES: ClientStatus[] = ["prospect", "active", "paused"];

/* ─── list ─── */

export async function listClients(opts?: {
  status?: ClientListFilter;
  q?: string;
}): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  const filter = opts?.status ?? "operational";
  if (filter === "operational") {
    query = query.in("status", OPERATIONAL_STATUSES);
  } else if (filter !== "all") {
    query = query.eq("status", filter);
  }

  if (opts?.q && opts.q.trim()) {
    const term = `%${opts.q.trim()}%`;
    query = query.or(
      [
        `name.ilike.${term}`,
        `legal_name.ilike.${term}`,
        `contact_name.ilike.${term}`,
        `email.ilike.${term}`,
        `cnpj.ilike.${term}`,
        `segment.ilike.${term}`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[listClients]", error);
    return [];
  }
  return data ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("[getClient]", error);
    return null;
  }
  return data as Client;
}

/* ─── create / update ─── */

export async function createClient(
  values: ClientFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ClientSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(normalizeClientForm(parsed.data))
    .select("id")
    .single();

  if (error) {
    console.error("[createClient]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

export async function updateClient(
  id: string,
  values: ClientFormValues,
): Promise<ActionResult> {
  const parsed = ClientSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update(normalizeClientForm(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("[updateClient]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ─── arquivar / reativar ─── */

export async function setClientStatus(
  id: string,
  status: ClientStatus,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[setClientStatus]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/projects");
  return { ok: true };
}

export async function createClientAndRedirect(values: ClientFormValues) {
  const result = await createClient(values);
  if (result.ok) {
    redirect("/clients");
  }
  return result;
}
