"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActivitySchema, type ActivityFormValues } from "@/lib/schemas/activity";
import { createActivity, updateActivity } from "@/lib/actions/activities";
import { activityPhaseLabels } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ActivityWithDeps } from "@/types/database";

const phaseOptions = Object.entries(activityPhaseLabels) as [
  ActivityFormValues["phase"],
  string,
][];

const statusOptions: [ActivityFormValues["status"], string][] = [
  ["not_started", "não iniciada"],
  ["in_progress", "em andamento"],
  ["completed", "concluída"],
  ["delayed", "atrasada"],
];

function defaultFormValues(
  initial?: ActivityWithDeps | null,
): ActivityFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    phase: initial?.phase ?? "production",
    kind: initial?.kind ?? "activity",
    status: initial?.status ?? "not_started",
    estimated_duration_days: initial?.estimated_duration_days ?? 3,
    planned_start_date: initial?.planned_start_date ?? today,
    planned_end_date: initial?.planned_end_date ?? today,
    visible_to_client: initial?.visible_to_client ?? false,
    predecessor_ids: initial?.dependencies?.map((d) => d.predecessor_id) ?? [],
  };
}

export function ActivityEditDialog({
  projectId,
  activities,
  editing,
  open,
  onOpenChange,
  onCreated,
}: {
  projectId: string;
  activities: ActivityWithDeps[];
  editing?: ActivityWithDeps | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(ActivitySchema),
    defaultValues: defaultFormValues(editing),
  });

  const kind = watch("kind");
  const otherActivities = activities.filter((a) => a.id !== editing?.id);

  useEffect(() => {
    if (open) {
      reset(defaultFormValues(editing));
    }
  }, [open, editing, reset]);

  function onSubmit(values: ActivityFormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateActivity(editing.id, projectId, values)
        : await createActivity(projectId, values);
      if (result.ok) {
        toast.success(editing ? "Atividade atualizada." : "Atividade criada.");
        onOpenChange(false);
        onCreated?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar atividade" : "Nova atividade"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="act-name">Nome</Label>
            <Input id="act-name" {...register("name")} />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fase (etapa geral)</Label>
              <Controller
                control={control}
                name="phase"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      if (v) field.onChange(v as ActivityFormValues["phase"]);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {phaseOptions.map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      if (v) field.onChange(v as ActivityFormValues["kind"]);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">atividade</SelectItem>
                      <SelectItem value="milestone">marco</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="act-start">Início previsto</Label>
              <Input id="act-start" type="date" {...register("planned_start_date")} />
              {errors.planned_start_date && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.planned_start_date.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="act-end">Fim previsto</Label>
              <Input id="act-end" type="date" {...register("planned_end_date")} />
              {errors.planned_end_date && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.planned_end_date.message}
                </p>
              )}
            </div>
          </div>

          {kind === "activity" && (
            <div>
              <Label htmlFor="act-days">Duração (dias)</Label>
              <Input
                id="act-days"
                type="number"
                min={1}
                {...register("estimated_duration_days", { valueAsNumber: true })}
              />
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    if (v) field.onChange(v as ActivityFormValues["status"]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {!editing && otherActivities.length > 0 && (
            <div>
              <Label>Depende de (opcional)</Label>
              <div className="mt-2 max-h-32 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                {otherActivities.map((a) => {
                  const selected = getValues("predecessor_ids") ?? [];
                  const checked = selected.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = getValues("predecessor_ids") ?? [];
                          setValue(
                            "predecessor_ids",
                            e.target.checked
                              ? [...current, a.id]
                              : current.filter((id) => id !== a.id),
                          );
                        }}
                        className="rounded border-border"
                      />
                      {a.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("visible_to_client")}
              className="rounded border-border"
            />
            Visível ao cliente no portal
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
