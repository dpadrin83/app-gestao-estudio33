"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeActivity } from "@/lib/actions/activities";
import {
  activityStatusBarClass,
  barPosition,
  ganttMonthLabels,
  ganttRange,
} from "@/lib/gantt-utils";
import { ActivityStatusPill } from "@/components/schedule/activity-status-pill";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type {
  ActivityKind,
  ActivityWithDeps,
  TaskWithActivity,
} from "@/types/database";
import { taskStatusLabels } from "@/lib/format";
import { differenceInCalendarDays, startOfDay } from "date-fns";

const GRID =
  "grid grid-cols-[minmax(180px,1.2fr)_72px_72px_96px_minmax(220px,2fr)]";

export function ScheduleClassicGantt({
  projectId,
  projectName,
  activities,
  tasks,
  onEditActivity,
  readOnly = false,
}: {
  projectId: string;
  projectName?: string;
  activities: ActivityWithDeps[];
  tasks: TaskWithActivity[];
  onEditActivity?: (a: ActivityWithDeps) => void;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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

  const bars = useMemo(
    () =>
      activities.map((a) => ({
        id: a.id,
        start: a.planned_start_date,
        end: a.planned_end_date,
        status: a.status,
        kind: a.kind as ActivityKind,
      })),
    [activities],
  );

  const { rangeStart, totalDays } = ganttRange(
    bars.map((b) => ({
      id: b.id,
      label: "",
      start: b.start,
      end: b.end,
      status: b.status,
    })),
  );

  const months = ganttMonthLabels(
    rangeStart,
    addDaysFromRange(rangeStart, totalDays),
  );

  const todayLeft = useMemo(() => {
    const today = startOfDay(new Date());
    const left =
      (differenceInCalendarDays(today, rangeStart) / totalDays) * 100;
    if (left < 0 || left > 100) return null;
    return left;
  }, [rangeStart, totalDays]);

  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma atividade no cronograma.
      </p>
    );
  }

  function toggleComplete(activity: ActivityWithDeps) {
    if (readOnly || activity.status === "completed") return;
    startTransition(async () => {
      const result = await completeActivity(activity.id, projectId);
      if (result.ok) {
        toast.success("Atividade concluída.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card/30">
      <div className="min-w-[720px]">
        <div className={cn(GRID, "border-b border-border bg-black/35 font-mono text-[9px] uppercase tracking-wider text-muted-foreground")}>
          <div className="border-r border-border px-3 py-2">Atividade</div>
          <div className="border-r border-border px-2 py-2">Início</div>
          <div className="border-r border-border px-2 py-2">Fim</div>
          <div className="border-r border-border px-2 py-2">Status</div>
          <div className="px-2 py-2">Timeline</div>
        </div>

        <div className={cn(GRID, "border-b border-border")}>
          <div className="col-span-4" />
          <div className="flex border-l border-border">
            {months.map((m) => (
              <span
                key={m}
                className="flex-1 border-l border-border py-1.5 text-center font-mono text-[9px] text-muted-foreground first:border-l-0"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {projectName && (
          <div className="border-b border-border bg-brand-orange/6 px-3 py-2 text-xs font-semibold text-brand-orange">
            {projectName}
          </div>
        )}

        {activities.map((activity) => {
          const pos = barPosition(
            activity.planned_start_date,
            activity.planned_end_date,
            rangeStart,
            totalDays,
          );
          const subtasks = tasksByActivity.get(activity.id) ?? [];

          return (
            <div key={activity.id}>
              <div
                className={cn(
                  GRID,
                  "items-center border-b border-border hover:bg-white/[0.02]",
                )}
              >
                <div className="flex min-w-0 items-center gap-2 border-r border-border px-3 py-2">
                  {!readOnly && (
                    <input
                      type="checkbox"
                      className="size-3.5 shrink-0 accent-brand-purple"
                      checked={activity.status === "completed"}
                      disabled={pending}
                      onChange={() => toggleComplete(activity)}
                      aria-label={`Concluir ${activity.name}`}
                    />
                  )}
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 truncate text-left text-sm",
                      onEditActivity && "hover:text-brand-orange",
                    )}
                    onClick={() => onEditActivity?.(activity)}
                    disabled={!onEditActivity}
                  >
                    {activity.name}
                  </button>
                  {onEditActivity && (
                    <button
                      type="button"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onEditActivity(activity)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="border-r border-border px-2 py-2 font-mono text-xs text-muted-foreground">
                  {formatDate(activity.planned_start_date, "dd/MM")}
                </div>
                <div className="border-r border-border px-2 py-2 font-mono text-xs text-muted-foreground">
                  {formatDate(activity.planned_end_date, "dd/MM")}
                </div>
                <div className="border-r border-border px-2 py-2">
                  <ActivityStatusPill
                    status={activity.status}
                    label={
                      activity.kind === "milestone" ? "marco" : undefined
                    }
                  />
                </div>
                <div className="relative h-8 px-2">
                  {todayLeft != null && (
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-brand-pink"
                      style={{ left: `${todayLeft}%` }}
                    />
                  )}
                  <div className="relative h-full rounded-md bg-secondary/30">
                    {activity.kind === "milestone" ? (
                      <div
                        className="absolute top-1/2 z-[1] size-2.5 -translate-y-1/2 rotate-45 rounded-sm bg-gradient-to-br from-brand-yellow via-brand-pink to-brand-blue"
                        style={{ left: `${pos.left}%` }}
                        title={activity.planned_end_date}
                      />
                    ) : (
                      <div
                        className={cn(
                          "absolute top-1 bottom-1 rounded-md",
                          activityStatusBarClass[activity.status],
                        )}
                        style={{
                          left: `${pos.left}%`,
                          width: `${pos.width}%`,
                        }}
                        title={`${activity.planned_start_date} → ${activity.planned_end_date}`}
                      />
                    )}
                  </div>
                </div>
              </div>

              {subtasks.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    GRID,
                    "items-center border-b border-border/60 bg-black/10 text-sm text-muted-foreground",
                  )}
                >
                  <div className="border-r border-border px-3 py-1.5 pl-8">
                    ↳ {t.title}
                  </div>
                  <div className="border-r border-border px-2 py-1.5">—</div>
                  <div className="border-r border-border px-2 py-1.5">—</div>
                  <div className="border-r border-border px-2 py-1.5">
                    <span className="font-mono text-[9px] uppercase">
                      {taskStatusLabels[t.status]}
                    </span>
                  </div>
                  <div className="px-2 py-1.5" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function addDaysFromRange(start: Date, totalDays: number) {
  const d = new Date(start);
  d.setDate(d.getDate() + totalDays - 1);
  return d;
}
