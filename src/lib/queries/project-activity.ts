import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deliverableStatusLabels } from "@/lib/format";

export type ProjectActivityItem = {
  id: string;
  at: string;
  kind:
    | "deliverable_status"
    | "deliverable_comment"
    | "time_session"
    | "task_done";
  title: string;
  detail?: string;
};

export async function getProjectActivityFeed(
  projectId: string,
  limit = 20,
): Promise<ProjectActivityItem[]> {
  const supabase = await createSupabaseServerClient();
  const items: ProjectActivityItem[] = [];

  const { data: projectDeliverables } = await supabase
    .from("deliverables")
    .select("id, name, status, updated_at")
    .eq("project_id", projectId);

  const deliverableIds = (projectDeliverables ?? []).map((d) => d.id);

  const [
    { data: comments },
    { data: sessions },
    { data: tasks },
  ] = await Promise.all([
    deliverableIds.length > 0
      ? supabase
          .from("deliverable_comments")
          .select("id, body, author_role, created_at, deliverable_id")
          .in("deliverable_id", deliverableIds)
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
    supabase
      .from("time_sessions")
      .select("id, started_at, ended_at, description")
      .eq("project_id", projectId)
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("tasks")
      .select("id, title, status, updated_at")
      .eq("project_id", projectId)
      .eq("status", "done")
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const deliverableNameById = new Map(
    (projectDeliverables ?? []).map((d) => [d.id, d.name]),
  );

  const deliverables = (projectDeliverables ?? [])
    .filter((d) => d.status !== "draft")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 12);

  for (const d of deliverables ?? []) {
    items.push({
      id: `del-${d.id}-${d.updated_at}`,
      at: d.updated_at,
      kind: "deliverable_status",
      title: d.name,
      detail: deliverableStatusLabels[
        d.status as keyof typeof deliverableStatusLabels
      ] ?? d.status,
    });
  }

  for (const c of comments ?? []) {
    items.push({
      id: `com-${c.id}`,
      at: c.created_at,
      kind: "deliverable_comment",
      title:
        deliverableNameById.get(c.deliverable_id as string) ?? "Entregável",
      detail: `${c.author_role === "client" ? "Cliente" : "Você"}: ${c.body}`,
    });
  }

  for (const s of sessions ?? []) {
    items.push({
      id: `ses-${s.id}`,
      at: s.started_at,
      kind: "time_session",
      title: s.ended_at ? "Sessão de horas encerrada" : "Sessão de horas iniciada",
      detail: s.description?.trim() || undefined,
    });
  }

  for (const t of tasks ?? []) {
    items.push({
      id: `task-${t.id}`,
      at: t.updated_at,
      kind: "task_done",
      title: t.title,
      detail: "Tarefa concluída",
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}
