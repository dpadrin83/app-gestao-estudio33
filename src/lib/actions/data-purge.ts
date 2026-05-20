"use server";

import { revalidatePath } from "next/cache";
import { getHubRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/actions/clients";

const DEMO_PREFIX = "[DEMO]%";

async function requireAdmin(): Promise<ActionResult<never>> {
  const { role } = await getHubRole();
  if (role !== "admin") {
    return { ok: false, error: "Apenas administradores podem apagar dados." };
  }
  try {
    createSupabaseAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para apagar dados com segurança.",
    };
  }
  return { ok: true };
}

export type PublishedDataStats = {
  clients: number;
  projects: number;
  demoClients: number;
  demoProjects: number;
};

export async function getPublishedDataStats(): Promise<PublishedDataStats> {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { clients: 0, projects: 0, demoClients: 0, demoProjects: 0 };
  }

  const admin = createSupabaseAdminClient();
  const [clients, projects, demoClients, demoProjects] = await Promise.all([
    admin.from("clients").select("*", { count: "exact", head: true }),
    admin.from("projects").select("*", { count: "exact", head: true }),
    admin
      .from("clients")
      .select("*", { count: "exact", head: true })
      .like("name", DEMO_PREFIX),
    admin
      .from("projects")
      .select("*", { count: "exact", head: true })
      .like("name", DEMO_PREFIX),
  ]);

  return {
    clients: clients.count ?? 0,
    projects: projects.count ?? 0,
    demoClients: demoClients.count ?? 0,
    demoProjects: demoProjects.count ?? 0,
  };
}

async function deleteProjectsByFilter(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  filter: "demo" | "all",
): Promise<number> {
  let query = admin.from("projects").select("id");
  if (filter === "demo") {
    query = query.like("name", DEMO_PREFIX);
  }
  const { data, error } = await query;
  if (error) throw error;
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length === 0) return 0;

  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error: delErr } = await admin.from("projects").delete().in("id", chunk);
    if (delErr) throw delErr;
  }
  return ids.length;
}

async function deleteClientsByFilter(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  filter: "demo" | "all",
): Promise<number> {
  let query = admin.from("clients").select("id");
  if (filter === "demo") {
    query = query.like("name", DEMO_PREFIX);
  }
  const { data, error } = await query;
  if (error) throw error;
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length === 0) return 0;

  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error: delErr } = await admin.from("clients").delete().in("id", chunk);
    if (delErr) throw delErr;
  }
  return ids.length;
}

function revalidateAfterPurge() {
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/schedule");
  revalidatePath("/finance");
  revalidatePath("/services");
  revalidatePath("/settings");
}

/** Remove clientes e projetos com prefixo [DEMO]. */
export async function purgeDemoData(): Promise<
  ActionResult<{ projects: number; clients: number }>
> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const admin = createSupabaseAdminClient();
    const projects = await deleteProjectsByFilter(admin, "demo");
    const clients = await deleteClientsByFilter(admin, "demo");
    revalidateAfterPurge();
    return { ok: true, data: { projects, clients } };
  } catch (e) {
    console.error("[purgeDemoData]", e);
    return {
      ok: false,
      error: "Não foi possível apagar os dados demo. Verifique o Supabase.",
    };
  }
}

/** Remove todos os clientes e projetos (mantém templates, prompts e configurações). */
export async function purgeAllOperationalData(): Promise<
  ActionResult<{ projects: number; clients: number }>
> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const admin = createSupabaseAdminClient();
    const projects = await deleteProjectsByFilter(admin, "all");
    const clients = await deleteClientsByFilter(admin, "all");
    revalidateAfterPurge();
    return { ok: true, data: { projects, clients } };
  } catch (e) {
    console.error("[purgeAllOperationalData]", e);
    return {
      ok: false,
      error: "Não foi possível apagar os dados. Verifique o Supabase.",
    };
  }
}
