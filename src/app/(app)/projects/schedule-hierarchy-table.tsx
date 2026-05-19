"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  patchActivity,
  completeActivity,
  completePhaseActivities,
} from "@/lib/actions/activities";
import { createTask, moveTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { ScheduleRowActions } from "@/components/schedule/schedule-row-actions";
import { toast } from "sonner";
import {
  activityPhaseLabels,
  activityStatusLabels,
  taskStatusLabels,
} from "@/lib/format";
import { PHASE_ORDER } from "@/lib/project-phase";
import type {
  ActivityPhase,
  ActivityStatus,
  ActivityWithDeps,
  TaskStatus,
  TaskWithActivity,
} from "@/types/database";
import { cn } from "@/lib/utils";

const statusOptions = Object.entries(activityStatusLabels) as [
  ActivityStatus,
  string,
][];

const taskStatusOptions = Object.entries(taskStatusLabels) as [
  TaskStatus,
  string,
][];

export function ScheduleHierarchyTable({
  projectId,
  activities,
  tasks,
  onEditActivity,
  onDeleteActivity,
  pending: parentPending,
}: {
  projectId: string;
  activities: ActivityWithDeps[];
  tasks: TaskWithActivity[];
  onEditActivity: (a: ActivityWithDeps) => void;
  onDeleteActivity: (id: string) => void;
  pending?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newTaskForActivity, setNewTaskForActivity] = useState<string | null>(
    null,
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const tasksByActivity = useMemo(() => {
    const map = new Map<string, TaskWithActivity[]>();
    const unlinked: TaskWithActivity[] = [];
    for (const t of tasks) {
      if (t.activity_id) {
        const list = map.get(t.activity_id) ?? [];
        list.push(t);
        map.set(t.activity_id, list);
      } else {
        unlinked.push(t);
      }
    }
    return { map, unlinked };
  }, [tasks]);

  const phasesWithData = useMemo(() => {
    const usedPhases = new Set(activities.map((a) => a.phase));
    if (tasksByActivity.unlinked.length > 0) usedPhases.add("other");
    return PHASE_ORDER.filter((p) => usedPhases.has(p));
  }, [activities, tasksByActivity.unlinked.length]);

  function togglePhase(phase: string) {
    setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }));
  }

  function run(
    fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro.");
      }
    });
  }

  function handleActivityField<K extends keyof Parameters<typeof patchActivity>[2]>(
    activityId: string,
    field: K,
    value: Parameters<typeof patchActivity>[2][K],
  ) {
    run(
      () => patchActivity(activityId, projectId, { [field]: value }),
      "Atualizado.",
    );
  }

  function submitNewTask(activityId: string) {
    const title = newTaskTitle.trim();
    if (title.length < 2) {
      toast.error("Digite um título para a subtarefa.");
      return;
    }
    run(
      async () =>
        createTask(projectId, {
          title,
          status: "todo",
          activity_id: activityId,
        }),
      "Subtarefa criada.",
    );
    setNewTaskTitle("");
    setNewTaskForActivity(null);
  }

  if (activities.length === 0 && tasks.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Cronograma vazio. Adicione atividades ou aplique um template.
      </Card>
    );
  }

  const busy = pending || parentPending;

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Etapa / item</TableHead>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead className="w-[130px]">Início</TableHead>
            <TableHead className="w-[130px]">Fim</TableHead>
            <TableHead className="w-[72px]">Dias</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[72px] text-center">Portal</TableHead>
            <TableHead className="w-[152px] min-w-[152px] text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phasesWithData.map((phase) => {
            const phaseActivities = activities.filter((a) => a.phase === phase);
            const isCollapsed = collapsed[phase] ?? false;
            const completedCount = phaseActivities.filter(
              (a) => a.status === "completed",
            ).length;
            const phaseTasksDone = phaseActivities.reduce((acc, a) => {
              const ts = tasksByActivity.map.get(a.id) ?? [];
              return acc + ts.filter((t) => t.status === "done").length;
            }, 0);
            const phaseTasksTotal = phaseActivities.reduce(
              (acc, a) => acc + (tasksByActivity.map.get(a.id)?.length ?? 0),
              0,
            );

            return (
              <PhaseBlock
                key={phase}
                phase={phase}
                isCollapsed={isCollapsed}
                onToggle={() => togglePhase(phase)}
                completedCount={completedCount}
                totalCount={phaseActivities.length}
                tasksDone={phaseTasksDone}
                tasksTotal={phaseTasksTotal}
                onCompletePhase={() =>
                  run(
                    () => completePhaseActivities(projectId, phase),
                    "Fase marcada como concluída.",
                  )
                }
                busy={busy}
              >
                {!isCollapsed &&
                  phaseActivities.map((a) => (
                    <ActivityRows
                      key={a.id}
                      activity={a}
                      subtasks={tasksByActivity.map.get(a.id) ?? []}
                      busy={busy}
                      newTaskOpen={newTaskForActivity === a.id}
                      newTaskTitle={newTaskTitle}
                      onNewTaskOpen={() => {
                        setNewTaskForActivity(a.id);
                        setNewTaskTitle("");
                      }}
                      onNewTaskTitleChange={setNewTaskTitle}
                      onNewTaskSubmit={() => submitNewTask(a.id)}
                      onNewTaskCancel={() => setNewTaskForActivity(null)}
                      onFieldChange={handleActivityField}
                      onComplete={() =>
                        run(
                          () => completeActivity(a.id, projectId),
                          "Atividade concluída.",
                        )
                      }
                      onEdit={() => onEditActivity(a)}
                      onDelete={() => onDeleteActivity(a.id)}
                      onTaskStatus={(taskId, status) =>
                        run(
                          () => moveTaskStatus(taskId, projectId, status),
                          "Subtarefa atualizada.",
                        )
                      }
                      onTaskDelete={(taskId) => {
                        if (!confirm("Excluir subtarefa?")) return;
                        run(
                          () => deleteTask(taskId, projectId),
                          "Subtarefa excluída.",
                        );
                      }}
                    />
                  ))}
                {!isCollapsed &&
                  phase === "other" &&
                  tasksByActivity.unlinked.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      busy={busy}
                      onStatus={(status) =>
                        run(
                          () => moveTaskStatus(t.id, projectId, status),
                          "Atualizado.",
                        )
                      }
                      onDelete={() => {
                        if (!confirm("Excluir subtarefa?")) return;
                        run(
                          () => deleteTask(t.id, projectId),
                          "Subtarefa excluída.",
                        );
                      }}
                    />
                  ))}
              </PhaseBlock>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function PhaseBlock({
  phase,
  isCollapsed,
  onToggle,
  completedCount,
  totalCount,
  tasksDone,
  tasksTotal,
  onCompletePhase,
  busy,
  children,
}: {
  phase: ActivityPhase;
  isCollapsed: boolean;
  onToggle: () => void;
  completedCount: number;
  totalCount: number;
  tasksDone: number;
  tasksTotal: number;
  onCompletePhase: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const allDone = totalCount > 0 && completedCount === totalCount;
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/50">
        <TableCell colSpan={8} className="py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-2 font-semibold capitalize"
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              {activityPhaseLabels[phase]}
              <span className="font-mono text-[10px] font-normal text-muted-foreground">
                {completedCount}/{totalCount} atividades
                {tasksTotal > 0 && ` · ${tasksDone}/${tasksTotal} subtarefas`}
              </span>
            </button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={busy || allDone || totalCount === 0}
              onClick={onCompletePhase}
            >
              <Check className="size-3.5 text-success" />
              Concluir fase
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {children}
    </>
  );
}

function ActivityRows({
  activity: a,
  subtasks,
  busy,
  newTaskOpen,
  newTaskTitle,
  onNewTaskOpen,
  onNewTaskTitleChange,
  onNewTaskSubmit,
  onNewTaskCancel,
  onFieldChange,
  onComplete,
  onEdit,
  onDelete,
  onTaskStatus,
  onTaskDelete,
}: {
  activity: ActivityWithDeps;
  subtasks: TaskWithActivity[];
  busy?: boolean;
  newTaskOpen: boolean;
  newTaskTitle: string;
  onNewTaskOpen: () => void;
  onNewTaskTitleChange: (v: string) => void;
  onNewTaskSubmit: () => void;
  onNewTaskCancel: () => void;
  onFieldChange: <K extends keyof Parameters<typeof patchActivity>[2]>(
    id: string,
    field: K,
    value: Parameters<typeof patchActivity>[2][K],
  ) => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTaskStatus: (taskId: string, status: TaskStatus) => void;
  onTaskDelete: (taskId: string) => void;
}) {
  const rowVersion = `${a.planned_start_date}-${a.planned_end_date}-${a.status}-${a.estimated_duration_days}-${a.visible_to_client}`;

  return (
    <>
      <TableRow className={cn(a.status === "completed" && "opacity-70")}>
        <TableCell>
          <p className="font-medium">{a.name}</p>
          {a.dependencies.length > 0 && (
            <p className="font-mono text-[10px] text-muted-foreground">
              após: {a.dependencies.map((d) => d.predecessor.name).join(", ")}
            </p>
          )}
        </TableCell>
        <TableCell className="text-xs capitalize">
          {a.kind === "milestone" ? "marco" : "atividade"}
        </TableCell>
        <TableCell>
          <Input
            key={`start-${a.id}-${rowVersion}`}
            type="date"
            className="h-8 font-mono text-xs"
            defaultValue={a.planned_start_date}
            disabled={busy}
            onBlur={(e) => {
              const v = e.target.value;
              if (!v) {
                toast.error("Informe a data de início.");
                e.target.value = a.planned_start_date;
                return;
              }
              if (v !== a.planned_start_date) {
                onFieldChange(a.id, "planned_start_date", v);
              }
            }}
          />
        </TableCell>
        <TableCell>
          <Input
            key={`end-${a.id}-${rowVersion}`}
            type="date"
            className="h-8 font-mono text-xs"
            defaultValue={a.planned_end_date}
            disabled={busy}
            onBlur={(e) => {
              const v = e.target.value;
              if (!v) {
                toast.error("Informe a data de fim.");
                e.target.value = a.planned_end_date;
                return;
              }
              if (v !== a.planned_end_date) {
                onFieldChange(a.id, "planned_end_date", v);
              }
            }}
          />
        </TableCell>
        <TableCell>
          {a.kind === "milestone" ? (
            <span className="font-mono text-xs text-muted-foreground">—</span>
          ) : (
            <Input
              key={`days-${a.id}-${rowVersion}`}
              type="number"
              min={1}
              className="h-8 w-16 font-mono text-xs"
              defaultValue={a.estimated_duration_days}
              disabled={busy}
              onBlur={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  toast.error("Informe a duração em dias.");
                  e.target.value = String(a.estimated_duration_days);
                  return;
                }
                const n = parseInt(raw, 10);
                if (Number.isNaN(n) || n < 1) {
                  toast.error("Duração mínima: 1 dia.");
                  e.target.value = String(a.estimated_duration_days);
                  return;
                }
                if (n !== a.estimated_duration_days) {
                  onFieldChange(a.id, "estimated_duration_days", n);
                }
              }}
            />
          )}
        </TableCell>
        <TableCell>
          <select
            key={`status-${a.id}-${rowVersion}`}
            className="h-8 w-full rounded-md border border-border bg-card px-2 text-xs"
            value={a.status}
            disabled={busy}
            onChange={(e) =>
              onFieldChange(a.id, "status", e.target.value as ActivityStatus)
            }
          >
            {statusOptions.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </TableCell>
        <TableCell className="text-center">
          <input
            type="checkbox"
            checked={a.visible_to_client}
            disabled={busy}
            className="rounded border-border"
            title="Visível no portal do cliente"
            onChange={(e) =>
              onFieldChange(a.id, "visible_to_client", e.target.checked)
            }
          />
        </TableCell>
        <TableCell className="text-right">
          <ScheduleRowActions
            busy={busy}
            completed={a.status === "completed"}
            onComplete={onComplete}
            onAddSubtask={onNewTaskOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </TableCell>
      </TableRow>
      {subtasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          indent
          busy={busy}
          onStatus={(status) => onTaskStatus(t.id, status)}
          onDelete={() => onTaskDelete(t.id)}
        />
      ))}
      {newTaskOpen && (
        <TableRow className="bg-card/30">
          <TableCell colSpan={8}>
            <div className="flex items-center gap-2 pl-6">
              <span className="text-xs text-muted-foreground">Nova subtarefa:</span>
              <Input
                className="h-8 max-w-sm flex-1"
                placeholder="Título da subtarefa"
                value={newTaskTitle}
                autoFocus
                onChange={(e) => onNewTaskTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onNewTaskSubmit();
                  if (e.key === "Escape") onNewTaskCancel();
                }}
              />
              <Button type="button" size="sm" disabled={busy} onClick={onNewTaskSubmit}>
                Adicionar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onNewTaskCancel}>
                Cancelar
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function TaskRow({
  task: t,
  indent,
  busy,
  onStatus,
  onDelete,
}: {
  task: TaskWithActivity;
  indent?: boolean;
  busy?: boolean;
  onStatus: (status: TaskStatus) => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className={cn("bg-card/20", t.status === "done" && "opacity-60")}>
      <TableCell>
        <p className={cn("text-sm", indent && "pl-6 border-l-2 border-brand-purple/30")}>
          ↳ {t.title}
        </p>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">subtarefa</TableCell>
      <TableCell colSpan={2} />
      <TableCell />
      <TableCell>
        <select
          className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
          value={t.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as TaskStatus)}
        >
          {taskStatusOptions.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell />
      <TableCell className="text-right">
        <ScheduleRowActions
          busy={busy}
          showComplete={false}
          showAddSubtask={false}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
