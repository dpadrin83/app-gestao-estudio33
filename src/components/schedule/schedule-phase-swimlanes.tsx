"use client";

import { useMemo } from "react";
import { ActivityStatusPill } from "@/components/schedule/activity-status-pill";
import { activityProgressPercent } from "@/lib/gantt-utils";
import {
  activityPhaseLabels,
  activityStatusLabels,
  formatDateShort,
  taskStatusLabels,
} from "@/lib/format";
import { PHASE_ORDER } from "@/lib/project-phase";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import type {
  Activity,
  ActivityPhase,
  ActivityWithDeps,
  TaskWithActivity,
} from "@/types/database";

const laneHeadClass: Record<ActivityPhase, string> = {
  planning: "text-indigo-300",
  production: "text-orange-300",
  review: "text-pink-300",
  delivery: "text-green-300",
  other: "text-muted-foreground",
};

const laneBorderClass: Record<ActivityPhase, string> = {
  planning: "border-indigo-500/20",
  production: "border-orange-500/20",
  review: "border-pink-500/20",
  delivery: "border-green-500/20",
  other: "border-border",
};

export function SchedulePhaseSwimlanes({
  activities,
  tasks = [],
  onEditActivity,
  readOnly = false,
}: {
  activities: Activity[] | ActivityWithDeps[];
  tasks?: TaskWithActivity[];
  onEditActivity?: (a: ActivityWithDeps) => void;
  readOnly?: boolean;
}) {
  const tasksByActivity = useMemo(() => {
    const map = new Map<string, TaskWithActivity[]>();
    for (const t of tasks) {
      if (!t.activity_id) continue;
      const list = map.get(t.activity_id) ?? [];
      list.push(t);
      map.set(t.activity_id, list);
    }
    return map;
  }, [tasks]);

  const byPhase = useMemo(() => {
    const map = new Map<ActivityPhase, Activity[]>();
    for (const a of activities) {
      const list = map.get(a.phase) ?? [];
      list.push(a);
      map.set(a.phase, list);
    }
    return map;
  }, [activities]);

  const phases = PHASE_ORDER;

  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma atividade no cronograma.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {phases.map((phase) => {
        const list = byPhase.get(phase) ?? [];
        const done = list.filter((a) => a.status === "completed").length;

        return (
          <div
            key={phase}
            className={cn(
              "flex min-h-[280px] flex-col rounded-xl border bg-card/40",
              laneBorderClass[phase],
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span
                className={cn(
                  "text-sm font-semibold capitalize",
                  laneHeadClass[phase],
                )}
              >
                {activityPhaseLabels[phase]}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {done}/{list.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {list.length === 0 ? (
                <p className="p-2 text-xs text-muted-foreground">
                  Nenhuma atividade nesta fase ainda.
                </p>
              ) : (
                list.map((activity) => {
                  const progress = activityProgressPercent(activity.status);
                  const subtasks = tasksByActivity.get(activity.id) ?? [];
                  const isDone = activity.status === "completed";
                  const isActive =
                    activity.status === "in_progress" ||
                    activity.status === "delayed";

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "rounded-lg border border-border bg-black/25 p-3 text-sm",
                        isDone && "border-l-[3px] border-l-success opacity-80",
                        isActive &&
                          "border-l-[3px] border-l-brand-orange shadow-[0_0_0_1px_rgba(255,84,0,0.15)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">{activity.name}</p>
                        {onEditActivity && !readOnly && (
                          <button
                            type="button"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              onEditActivity(activity as ActivityWithDeps)
                            }
                            aria-label="Editar"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {formatDateShort(activity.planned_start_date)}
                        {activity.planned_start_date !==
                          activity.planned_end_date &&
                          ` – ${formatDateShort(activity.planned_end_date)}`}
                        {" · "}
                        {activity.kind === "milestone"
                          ? "marco"
                          : activityStatusLabels[activity.status]}
                      </p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-blue"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {subtasks.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
                          {subtasks.map((t) => (
                            <li
                              key={t.id}
                              className="text-xs text-muted-foreground"
                            >
                              ↳ {t.title}
                              <span className="ml-1 font-mono text-[9px] uppercase">
                                · {taskStatusLabels[t.status]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!readOnly && (
                        <div className="mt-2">
                          <ActivityStatusPill status={activity.status} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
