import "server-only";
import { addDays, format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectStatus, ProjectWithClient } from "@/types/database";

export type ProjectListItem = ProjectWithClient & {
  progressPercent: number | null;
  atRisk: boolean;
  pendingDeliverables: number;
};

export async function listProjectsEnriched(opts?: {
  status?: ProjectStatus[];
  clientId?: string;
  atRiskOnly?: boolean;
}): Promise<ProjectListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("projects")
    .select("*, client:clients(id, name, status)")
    .order("created_at", { ascending: false });

  if (opts?.status && opts.status.length > 0) {
    query = query.in("status", opts.status);
  }
  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }

  const { data: projects, error } = await query;
  if (error) {
    console.error("[listProjectsEnriched]", error);
    return [];
  }

  const rows = (projects ?? []) as ProjectWithClient[];
  if (rows.length === 0) return [];

  const projectIds = rows.map((p) => p.id);
  const today = format(new Date(), "yyyy-MM-dd");
  const in7 = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [{ data: activities }, { data: deliverables }] = await Promise.all([
    supabase
      .from("activities")
      .select("project_id, status, planned_end_date")
      .in("project_id", projectIds),
    supabase
      .from("deliverables")
      .select("project_id, status")
      .in("project_id", projectIds)
      .eq("status", "sent_to_client"),
  ]);

  const stats = new Map<
    string,
    { total: number; completed: number; atRisk: boolean; pending: number }
  >();

  for (const id of projectIds) {
    stats.set(id, { total: 0, completed: 0, atRisk: false, pending: 0 });
  }

  for (const a of activities ?? []) {
    const s = stats.get(a.project_id);
    if (!s) continue;
    s.total += 1;
    if (a.status === "completed") s.completed += 1;
    if (a.status !== "completed") {
      if (a.planned_end_date < today) s.atRisk = true;
      else if (a.planned_end_date <= in7) s.atRisk = true;
    }
  }

  for (const d of deliverables ?? []) {
    const s = stats.get(d.project_id);
    if (s) s.pending += 1;
  }

  const enriched: ProjectListItem[] = rows.map((p) => {
    const s = stats.get(p.id)!;
    const progressPercent =
      s.total > 0 ? Math.round((s.completed / s.total) * 100) : null;
    return {
      ...p,
      progressPercent,
      atRisk: s.atRisk,
      pendingDeliverables: s.pending,
    };
  });

  if (opts?.atRiskOnly) {
    return enriched.filter((p) => p.atRisk);
  }

  return enriched;
}
