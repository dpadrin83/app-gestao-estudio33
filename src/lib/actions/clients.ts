"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientSchema, type ClientFormValues } from "@/lib/schemas/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Client, ClientStatus } from "@/types/database";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/* ─── list ─── */

export async function listClients(opts?: {
  status?: ClientStatus | "all";
  q?: string;
}): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts?.q && opts.q.trim()) {
    query = query.ilike("name", `%${opts.q.trim()}%`);
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
  return data;
}

/* ─── create / update ─── */

function normalize(values: ClientFormValues) {
  return {
    name: values.name.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    notes: values.notes?.trim() || null,
    status: values.status,
  };
}

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
    .insert(normalize(parsed.data))
    .select("id")
    .single();

  if (error) {
    console.error("[createClient]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath("/projects");
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
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("[updateClient]", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/projects");
  return { ok: true };
}

/* ─── soft delete (toggle status) ─── */

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
  return { ok: true };
}

/* ─── helper para redirect após criação ─── */

export async function createClientAndRedirect(values: ClientFormValues) {
  const result = await createClient(values);
  if (result.ok) {
    redirect("/clients");
  }
  return result;
}
