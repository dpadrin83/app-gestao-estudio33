import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PendingDeliverableRow = {
  id: string;
  name: string;
  updated_at: string;
  project: { id: string; name: string };
  clientName: string;
};

export async function listPendingDeliverables(
  limit = 8,
): Promise<PendingDeliverableRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(
      "id, name, updated_at, project:projects(id, name, client:clients(name))",
    )
    .eq("status", "sent_to_client")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[listPendingDeliverables]", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const raw = row.project as unknown;
    let project = { id: "", name: "—" };
    let clientName = "—";
    if (raw && typeof raw === "object") {
      const p = (Array.isArray(raw) ? raw[0] : raw) as {
        id: string;
        name: string;
        client?: { name?: string } | { name?: string }[];
      };
      if (p) {
        project = { id: p.id, name: p.name };
        const c = p.client;
        if (c && typeof c === "object") {
          clientName = (Array.isArray(c) ? c[0]?.name : c.name) ?? "—";
        }
      }
    }
    return {
      id: row.id as string,
      name: row.name as string,
      updated_at: row.updated_at as string,
      project,
      clientName,
    };
  });
}
