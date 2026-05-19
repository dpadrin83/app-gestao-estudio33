"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskSchema, type TaskFormValues } from "@/lib/schemas/task";
import {
  createTask,
  moveTaskStatus,
  deleteTask,
} from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { taskStatusLabels } from "@/lib/format";
import type { TaskStatus, TaskWithActivity } from "@/types/database";
import type { ActivityWithDeps } from "@/types/database";
import { cn } from "@/lib/utils";

const columns: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "todo", label: taskStatusLabels.todo, accent: "border-muted-foreground/30" },
  { status: "doing", label: taskStatusLabels.doing, accent: "border-brand-orange/40" },
  { status: "done", label: taskStatusLabels.done, accent: "border-success/40" },
];

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  todo: "doing",
  doing: "done",
  done: null,
};

const prevStatus: Record<TaskStatus, TaskStatus | null> = {
  todo: null,
  doing: "todo",
  done: "doing",
};

export function ProjectTasksKanban({
  projectId,
  tasks: initial,
  activities,
}: {
  projectId: string;
  tasks: TaskWithActivity[];
  activities: ActivityWithDeps[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      activity_id: "",
    },
  });

  function openCreate(status: TaskStatus) {
    setDefaultStatus(status);
    reset({
      title: "",
      description: "",
      status,
      activity_id: "",
    });
    setValue("status", status);
    setOpen(true);
  }

  function onSubmit(values: TaskFormValues) {
    startTransition(async () => {
      const result = await createTask(projectId, values);
      if (result.ok) {
        toast.success("Tarefa criada.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleMove(id: string, status: TaskStatus) {
    startTransition(async () => {
      const result = await moveTaskStatus(id, projectId, status);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    startTransition(async () => {
      const result = await deleteTask(id, projectId);
      if (result.ok) {
        toast.success("Tarefa excluída.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const byStatus = (status: TaskStatus) =>
    initial.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Itens do dia a dia — separados do cronograma. Use para micro-passos de execução.
      </p>

      <div className="grid gap-3 lg:grid-cols-3">
        {columns.map((col) => {
          const items = byStatus(col.status);
          return (
            <Card
              key={col.status}
              className={cn("flex flex-col border-t-2 p-3", col.accent)}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <ul className="min-h-[80px] flex-1 space-y-2">
                {items.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-lg border border-border bg-card/80 p-3"
                  >
                    <p className="text-sm font-medium leading-snug">{task.title}</p>
                    {task.activity && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        ↳ {task.activity.name}
                      </p>
                    )}
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      {prevStatus[col.status] && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={pending}
                          onClick={() =>
                            handleMove(task.id, prevStatus[col.status]!)
                          }
                          title="Voltar coluna"
                        >
                          <ChevronLeft className="size-3.5" />
                        </Button>
                      )}
                      {nextStatus[col.status] && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={pending}
                          onClick={() =>
                            handleMove(task.id, nextStatus[col.status]!)
                          }
                          title="Avançar coluna"
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-7 text-destructive"
                        disabled={pending}
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => openCreate(col.status)}
              >
                <Plus className="size-3.5" />
                Adicionar
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova tarefa — {taskStatusLabels[defaultStatus]}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título *</Label>
              <Input id="task-title" {...register("title")} autoFocus />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Detalhe</Label>
              <textarea
                id="task-desc"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("description")}
              />
            </div>
            {activities.length > 0 && (
              <div className="space-y-2">
                <Label>Atividade do cronograma (opcional)</Label>
                <Controller
                  control={control}
                  name="activity_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {activities.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            <input type="hidden" {...register("status")} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
