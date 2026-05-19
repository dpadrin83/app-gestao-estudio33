import "server-only";
import { listActivitiesByProject } from "@/lib/actions/activities";
import { listTasksByProject } from "@/lib/actions/tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityWithDeps, TaskWithActivity } from "@/types/database";

export type ScheduleProjectBlock = {
  project: {
    id: string;
    name: string;
    clientName: string;
  };
  activities: ActivityWithDeps[];
  tasks: TaskWithActivity[];
};

export async function listScheduleProjectBlocks(opts?: {
  clientId?: string;
}): Promise<ScheduleProjectBlock[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("projects")
    .select("id, name, client:clients(id, name)")
    .eq("status", "in_progress")
    .order("name");

  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }

  const { data: projects, error } = await query;
  if (error || !projects?.length) {
    if (error) console.error("[listScheduleProjectBlocks]", error);
    return [];
  }

  const blocks = await Promise.all(
    projects.map(async (p) => {
      const clientRaw = p.client as unknown;
      let clientName = "";
      if (clientRaw && typeof clientRaw === "object") {
        const c = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
        clientName = (c as { name?: string })?.name ?? "";
      }
      const [activities, tasks] = await Promise.all([
        listActivitiesByProject(p.id),
        listTasksByProject(p.id),
      ]);
      return {
        project: { id: p.id, name: p.name, clientName },
        activities,
        tasks,
      };
    }),
  );

  return blocks.filter(
    (b) => b.activities.length > 0 || b.tasks.length > 0,
  );
}
