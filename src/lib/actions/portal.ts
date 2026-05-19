"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHubRole } from "@/lib/auth/roles";
import { computeProjectPhaseSummary } from "@/lib/project-phase";
import type {
  DeliverableWithVersions,
  DeliverableVersion,
  DeliverableComment,
  Activity,
  ProjectWithClient,
} from "@/types/database";
import type { ProjectPhaseSummary } from "@/lib/project-phase";
import {
  computeProductionTime,
  type ProjectProductionTime,
} from "@/lib/portal/production-time";

export type PortalProjectListItem = ProjectWithClient & {
  phase: ProjectPhaseSummary;
  production: ProjectProductionTime;
};

export type PortalDashboardSummary = {
  inProductionCount: number;
  avgProgressPercent: number;
  pendingApprovals: number;
  pausedCount: number;
};

export type PortalClientBranding = {
  clientName: string;
  logoUrl: string | null;
  backgroundUrl: string | null;
  segment: string | null;
};

export type PortalDashboard = PortalClientBranding & {
  summary: PortalDashboardSummary;
  inProduction: PortalProjectListItem[];
  paused: PortalProjectListItem[];
  done: PortalProjectListItem[];
};

function groupVersionsAndComments(
  deliverables: Array<Record<string, unknown>>,
  versions: DeliverableVersion[],
  comments: DeliverableComment[],
): DeliverableWithVersions[] {
  const versionsBy = new Map<string, DeliverableVersion[]>();
  const commentsBy = new Map<string, DeliverableComment[]>();
  for (const ver of versions) {
    const list = versionsBy.get(ver.deliverable_id) ?? [];
    list.push(ver);
    versionsBy.set(ver.deliverable_id, list);
  }
  for (const com of comments) {
    const list = commentsBy.get(com.deliverable_id) ?? [];
    list.push(com);
    commentsBy.set(com.deliverable_id, list);
  }
  return deliverables.map((d) => ({
    ...d,
    versions: versionsBy.get(d.id as string) ?? [],
    comments: commentsBy.get(d.id as string) ?? [],
  })) as DeliverableWithVersions[];
}

export async function listPortalProjects(): Promise<PortalProjectListItem[]> {
  const { role, clientId } = await getHubRole();
  if (role !== "client" || !clientId) return [];

  const supabase = await createSupabaseServerClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, client:clients(id, name, status)")
    .eq("client_id", clientId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error || !projects?.length) {
    if (error) console.error("[listPortalProjects]", error);
    return [];
  }

  const projectIds = projects.map((p) => p.id);
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .in("project_id", projectIds)
    .eq("visible_to_client", true)
    .order("sort_order");

  const byProject = new Map<string, Activity[]>();
  for (const a of (activities ?? []) as Activity[]) {
    const list = byProject.get(a.project_id) ?? [];
    list.push(a);
    byProject.set(a.project_id, list);
  }

  return projects.map((p) => {
    const acts = byProject.get(p.id) ?? [];
    const status = p.status as ProjectWithClient["status"];
    return {
      ...(p as ProjectWithClient),
      phase: computeProjectPhaseSummary(acts, status),
      production: computeProductionTime(
        p.start_date,
        p.expected_end_date,
        status,
      ),
    };
  });
}

export async function getPortalClientBranding(): Promise<PortalClientBranding | null> {
  const { role, clientId } = await getHubRole();
  if (role !== "client" || !clientId) return null;

  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase
    .from("clients")
    .select("name, logo_url, portal_background_url, segment")
    .eq("id", clientId)
    .single();

  if (!client) return null;
  return {
    clientName: client.name,
    logoUrl: client.logo_url,
    backgroundUrl: client.portal_background_url,
    segment: client.segment,
  };
}

/** Painel da organização: dashboard visual + projetos em produção. */
export async function getPortalDashboard(): Promise<PortalDashboard | null> {
  const branding = await getPortalClientBranding();
  if (!branding) return null;

  const { clientId } = await getHubRole();
  if (!clientId) return null;

  const supabase = await createSupabaseServerClient();
  const projects = await listPortalProjects();
  const inProduction = projects.filter((p) => p.status === "in_progress");
  const paused = projects.filter((p) => p.status === "paused");
  const done = projects.filter((p) => p.status === "done");

  const projectIds = projects.map((p) => p.id);
  let pendingApprovals = 0;
  if (projectIds.length > 0) {
    const { count } = await supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds)
      .eq("status", "sent_to_client");
    pendingApprovals = count ?? 0;
  }

  const avgProgressPercent =
    inProduction.length > 0
      ? Math.round(
          inProduction.reduce((s, p) => s + p.phase.progressPercent, 0) /
            inProduction.length,
        )
      : 0;

  return {
    ...branding,
    summary: {
      inProductionCount: inProduction.length,
      avgProgressPercent,
      pendingApprovals,
      pausedCount: paused.length,
    },
    inProduction,
    paused,
    done,
  };
}

export async function getPortalProject(projectId: string): Promise<{
  project: ProjectWithClient | null;
  phase: ProjectPhaseSummary;
  milestones: Activity[];
  visibleActivities: Activity[];
  deliverables: DeliverableWithVersions[];
}> {
  const emptyPhase = computeProjectPhaseSummary([], undefined);
  const { role, clientId } = await getHubRole();
  if (role !== "client" || !clientId) {
    return {
      project: null,
      phase: emptyPhase,
      milestones: [],
      visibleActivities: [],
      deliverables: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, client:clients(id, name, status)")
    .eq("id", projectId)
    .eq("client_id", clientId)
    .single();

  if (!project) {
    return {
      project: null,
      phase: emptyPhase,
      milestones: [],
      visibleActivities: [],
      deliverables: [],
    };
  }

  const [visibleRes, deliverablesRes] = await Promise.all([
    supabase
      .from("activities")
      .select("*")
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .order("sort_order"),
    supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", projectId)
      .in("status", ["sent_to_client", "approved", "rejected"])
      .order("updated_at", { ascending: false }),
  ]);

  const visibleActivities = (visibleRes.data ?? []) as Activity[];
  const milestones = visibleActivities.filter((a) => a.kind === "milestone");
  const phase = computeProjectPhaseSummary(
    visibleActivities,
    project.status,
  );

  const deliverables = deliverablesRes.data ?? [];
  const ids = deliverables.map((d) => d.id);
  let versions: DeliverableVersion[] = [];
  let comments: DeliverableComment[] = [];

  if (ids.length > 0) {
    const [v, c] = await Promise.all([
      supabase
        .from("deliverable_versions")
        .select("*")
        .in("deliverable_id", ids)
        .order("version_number", { ascending: false }),
      supabase
        .from("deliverable_comments")
        .select("*")
        .in("deliverable_id", ids)
        .order("created_at", { ascending: false }),
    ]);
    versions = (v.data ?? []) as DeliverableVersion[];
    comments = (c.data ?? []) as DeliverableComment[];
  }

  return {
    project: project as ProjectWithClient,
    phase,
    milestones,
    visibleActivities,
    deliverables: groupVersionsAndComments(deliverables, versions, comments),
  };
}
