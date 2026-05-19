/**
 * Cálculo de fase operacional do projeto para o portal do cliente.
 * Usa apenas atividades marcadas como visíveis ao cliente.
 */
import type { Activity, ActivityPhase, ProjectStatus } from "@/types/database";
import { activityPhaseLabels } from "@/lib/format";

export const PHASE_ORDER: ActivityPhase[] = [
  "planning",
  "production",
  "review",
  "delivery",
];

export type PhaseStepState = "done" | "current" | "upcoming";

export interface PhaseStep {
  phase: ActivityPhase;
  label: string;
  state: PhaseStepState;
}

export interface ProjectPhaseSummary {
  currentPhase: ActivityPhase | null;
  currentPhaseLabel: string;
  progressPercent: number;
  steps: PhaseStep[];
  nextMilestoneName: string | null;
}

function visibleActivities(activities: Activity[]): Activity[] {
  return activities.filter((a) => a.visible_to_client);
}

export function computeProjectPhaseSummary(
  activities: Activity[],
  projectStatus?: ProjectStatus,
): ProjectPhaseSummary {
  const visible = visibleActivities(activities);

  if (projectStatus === "done") {
    return {
      currentPhase: "delivery",
      currentPhaseLabel: activityPhaseLabels.delivery,
      progressPercent: 100,
      steps: PHASE_ORDER.map((phase) => ({
        phase,
        label: activityPhaseLabels[phase],
        state: "done" as const,
      })),
      nextMilestoneName: null,
    };
  }

  if (projectStatus === "paused") {
    const base = computeFromActivities(visible);
    return { ...base, currentPhaseLabel: `${base.currentPhaseLabel} (pausado)` };
  }

  if (visible.length === 0) {
    return {
      currentPhase: null,
      currentPhaseLabel:
        projectStatus === "in_progress" ? "em andamento" : "aguardando início",
      progressPercent: 0,
      steps: PHASE_ORDER.map((phase, i) => ({
        phase,
        label: activityPhaseLabels[phase],
        state: (i === 0 ? "current" : "upcoming") as PhaseStepState,
      })),
      nextMilestoneName: null,
    };
  }

  return computeFromActivities(visible);
}

function computeFromActivities(visible: Activity[]): ProjectPhaseSummary {
  const total = visible.length;
  const completed = visible.filter((a) => a.status === "completed").length;
  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  let currentPhase: ActivityPhase | null = null;
  for (const phase of PHASE_ORDER) {
    const inPhase = visible.filter((a) => a.phase === phase);
    if (inPhase.length === 0) continue;
    const allDone = inPhase.every((a) => a.status === "completed");
    if (!allDone) {
      currentPhase = phase;
      break;
    }
  }
  if (!currentPhase && visible.length > 0) {
    currentPhase = visible[visible.length - 1]!.phase;
  }

  const steps: PhaseStep[] = PHASE_ORDER.map((phase) => {
    const inPhase = visible.filter((a) => a.phase === phase);
    if (inPhase.length === 0) {
      return {
        phase,
        label: activityPhaseLabels[phase],
        state: currentPhase === phase ? "current" : "upcoming",
      };
    }
    const allDone = inPhase.every((a) => a.status === "completed");
    if (allDone) {
      return { phase, label: activityPhaseLabels[phase], state: "done" };
    }
    if (phase === currentPhase) {
      return { phase, label: activityPhaseLabels[phase], state: "current" };
    }
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    const currentIndex = currentPhase
      ? PHASE_ORDER.indexOf(currentPhase)
      : -1;
    return {
      phase,
      label: activityPhaseLabels[phase],
      state: phaseIndex < currentIndex ? "done" : "upcoming",
    };
  });

  const upcoming = visible
    .filter((a) => a.kind === "milestone" && a.status !== "completed")
    .sort(
      (a, b) =>
        new Date(a.planned_start_date).getTime() -
        new Date(b.planned_start_date).getTime(),
    );
  const nextMilestoneName = upcoming[0]?.name ?? null;

  return {
    currentPhase,
    currentPhaseLabel: currentPhase
      ? activityPhaseLabels[currentPhase]
      : "em andamento",
    progressPercent,
    steps,
    nextMilestoneName,
  };
}

export interface DeliverablePlanStats {
  total: number;
  withLink: number;
  approved: number;
  pendingClient: number;
}

export function computeDeliverablePlanStats(
  deliverables: Array<{
    status: string;
    versions: Array<{ external_link: string | null }>;
  }>,
): DeliverablePlanStats {
  let withLink = 0;
  let approved = 0;
  let pendingClient = 0;
  for (const d of deliverables) {
    const latest = d.versions[0];
    if (latest?.external_link) withLink += 1;
    if (d.status === "approved") approved += 1;
    if (d.status === "sent_to_client") pendingClient += 1;
  }
  return {
    total: deliverables.length,
    withLink,
    approved,
    pendingClient,
  };
}
