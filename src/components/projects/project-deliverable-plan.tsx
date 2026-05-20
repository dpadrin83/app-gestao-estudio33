"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Plus, Pencil, Trash2, GitBranch, Calendar } from "lucide-react";
import { ImportCatalogDialog } from "@/components/projects/import-catalog-dialog";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeliverableStatusBadge } from "@/components/deliverable-status-badge";
import {
  DeliverablePlanItemSchema,
  type DeliverablePlanItemFormValues,
} from "@/lib/schemas/deliverable-plan";
import {
  createDeliverablePlanItem,
  updateDeliverablePlanItem,
  deleteDeliverablePlanItem,
  publishDeliverablePlanToSchedule,
} from "@/lib/actions/deliverable-plan";
import { deliverableTypeLabels } from "@/lib/format";
import type {
  DeliverableCatalogGroupWithItems,
  DeliverablePlanItem,
  StudioProfessional,
} from "@/types/database";

const types = Object.entries(deliverableTypeLabels) as [
  DeliverablePlanItemFormValues["deliverable_type"],
  string,
][];

const emptyForm: DeliverablePlanItemFormValues = {
  name: "",
  deliverable_type: "design",
  estimated_days: 3,
  professional_id: "",
  predecessor_id: "",
  notes: "",
};

function itemToForm(item: DeliverablePlanItem): DeliverablePlanItemFormValues {
  return {
    name: item.name,
    deliverable_type: item.deliverable_type,
    estimated_days: item.estimated_days,
    professional_id: item.professional_id ?? "",
    predecessor_id: item.predecessor_id ?? "",
    notes: item.notes ?? "",
  };
}

export function ProjectDeliverablePlan({
  projectId,
  items: initial,
  professionals,
  catalogGroups,
  hasScheduleActivities,
}: {
  projectId: string;
  items: DeliverablePlanItem[];
  professionals: StudioProfessional[];
  catalogGroups: DeliverableCatalogGroupWithItems[];
  hasScheduleActivities: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replaceSchedule, setReplaceSchedule] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DeliverablePlanItemFormValues>({
    resolver: zodResolver(DeliverablePlanItemSchema),
    defaultValues: emptyForm,
  });

  const predecessorOptions = initial.filter((i) => i.id !== editingId);

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    reset(emptyForm);
  }

  function startEdit(item: DeliverablePlanItem) {
    setEditingId(item.id);
    setOpen(true);
    reset(itemToForm(item));
  }

  function onSubmit(values: DeliverablePlanItemFormValues) {
    startTransition(async () => {
      const result = editingId
        ? await updateDeliverablePlanItem(editingId, projectId, values)
        : await createDeliverablePlanItem(projectId, values);
      if (result.ok) {
        toast.success(editingId ? "Entregável atualizado." : "Entregável adicionado ao plano.");
        closeForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este entregável do plano?")) return;
    startTransition(async () => {
      const result = await deleteDeliverablePlanItem(id, projectId);
      if (result.ok) {
        toast.success("Removido do plano.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function publish() {
    if (hasScheduleActivities && !replaceSchedule) {
      toast.error("Marque “Substituir cronograma” ou esvazie o Gantt antes.");
      return;
    }
    if (
      hasScheduleActivities &&
      replaceSchedule &&
      !confirm("Substituir todas as atividades do cronograma por este plano?")
    ) {
      return;
    }
    startTransition(async () => {
      const result = await publishDeliverablePlanToSchedule(
        projectId,
        replaceSchedule,
      );
      if (result.ok) {
        toast.success(
          `${result.data?.activities ?? 0} etapas publicadas no cronograma.`,
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const totalDays = initial.reduce((s, i) => s + i.estimated_days, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Plano deste projeto. Etapas padrão ficam no{" "}
            <Link
              href="/catalog/deliverables"
              className="text-brand-orange hover:underline"
            >
              Catálogo
            </Link>
            {" "}— importe com um clique ou adicione manualmente.
          </p>
          {initial.length > 0 && (
            <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
              {initial.length} entregável(is) · ~{totalDays} dias no plano
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportCatalogDialog
            projectId={projectId}
            groups={catalogGroups}
            hasExistingPlan={initial.length > 0}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (open && !editingId) closeForm();
              else {
                setEditingId(null);
                reset(emptyForm);
                setOpen(true);
              }
            }}
          >
            <Plus className="size-4" />
            Entregável
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || initial.length === 0}
            onClick={publish}
          >
            <Calendar className="size-4" />
            Publicar no cronograma
          </Button>
        </div>
      </div>

      {hasScheduleActivities && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={replaceSchedule}
            onChange={(e) => setReplaceSchedule(e.target.checked)}
            className="rounded border-border"
          />
          Substituir cronograma existente ao publicar
        </label>
      )}

      {open && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {editingId ? "Editar entregável" : "Novo entregável no plano"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome do entregável *</Label>
                <Input
                  placeholder="Ex.: Manual de marca, Site homologação…"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                  control={control}
                  name="deliverable_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (dias) *</Label>
                <Input
                  type="number"
                  min={1}
                  {...register("estimated_days", { valueAsNumber: true })}
                />
                {errors.estimated_days && (
                  <p className="text-xs text-destructive">
                    {errors.estimated_days.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Inicia após (dependência)</Label>
                <Controller
                  control={control}
                  name="predecessor_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma — começa no início do projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          Nenhuma — início do projeto
                        </SelectItem>
                        {predecessorOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  A próxima etapa só começa no dia seguinte ao fim da escolhida.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Profissional E33</Label>
                <Controller
                  control={control}
                  name="professional_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Observações</Label>
                <Input
                  placeholder="Escopo curto, referências…"
                  {...register("notes")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {initial.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum entregável no plano. Use <strong>+ Entregável</strong> para
          montar a sequência antes de publicar no cronograma.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entregável</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Depende de</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {deliverableTypeLabels[item.deliverable_type]}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.estimated_days}d
                  </TableCell>
                  <TableCell>
                    {item.predecessor ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranch className="size-3 shrink-0" />
                        {item.predecessor.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Início</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.professional?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {item.deliverable ? (
                      <DeliverableStatusBadge status={item.deliverable.status} />
                    ) : (
                      "—"
                    )}
                    {item.activity_id && (
                      <Link
                        href={`#cronograma`}
                        className="ml-1 text-[10px] text-brand-orange hover:underline"
                      >
                        no Gantt
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={pending}
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={pending}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {initial.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Os entregáveis também aparecem na aba{" "}
          <a href="#entregaveis" className="text-brand-orange hover:underline">
            Entregáveis
          </a>{" "}
          para versões e envio ao cliente.
        </p>
      )}
    </div>
  );
}
