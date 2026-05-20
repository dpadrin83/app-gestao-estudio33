"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, GitBranch } from "lucide-react";
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
import {
  DeliverableCatalogItemSchema,
  type DeliverableCatalogItemFormValues,
} from "@/lib/schemas/deliverable-catalog";
import {
  createDeliverableCatalogItem,
  updateDeliverableCatalogItem,
  deleteDeliverableCatalogItem,
} from "@/lib/actions/deliverable-catalog";
import {
  deliverableTypeLabels,
  serviceLineLabels,
} from "@/lib/format";
import type {
  DeliverableCatalogItem,
  StudioProfessional,
} from "@/types/database";

const types = Object.entries(deliverableTypeLabels) as [
  DeliverableCatalogItemFormValues["deliverable_type"],
  string,
][];

const serviceLines = Object.entries(serviceLineLabels) as [
  NonNullable<DeliverableCatalogItemFormValues["service_line"]>,
  string,
][];

const emptyForm: DeliverableCatalogItemFormValues = {
  name: "",
  deliverable_type: "design",
  estimated_days: 3,
  professional_id: "",
  predecessor_id: "",
  service_line: "",
  notes: "",
  is_active: true,
};

function itemToForm(item: DeliverableCatalogItem): DeliverableCatalogItemFormValues {
  return {
    name: item.name,
    deliverable_type: item.deliverable_type,
    estimated_days: item.estimated_days,
    professional_id: item.professional_id ?? "",
    predecessor_id: item.predecessor_id ?? "",
    service_line: item.service_line ?? "",
    notes: item.notes ?? "",
    is_active: item.is_active,
  };
}

export function DeliverableCatalogManager({
  items: initial,
  professionals,
}: {
  items: DeliverableCatalogItem[];
  professionals: StudioProfessional[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DeliverableCatalogItemFormValues>({
    resolver: zodResolver(DeliverableCatalogItemSchema),
    defaultValues: emptyForm,
  });

  const predecessorOptions = initial.filter((i) => i.id !== editingId);

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    reset(emptyForm);
  }

  function startEdit(item: DeliverableCatalogItem) {
    setEditingId(item.id);
    setOpen(true);
    reset(itemToForm(item));
  }

  function onSubmit(values: DeliverableCatalogItemFormValues) {
    startTransition(async () => {
      const result = editingId
        ? await updateDeliverableCatalogItem(editingId, values)
        : await createDeliverableCatalogItem(values);
      if (result.ok) {
        toast.success(editingId ? "Etapa atualizada." : "Etapa adicionada ao catálogo.");
        closeForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta etapa do catálogo?")) return;
    startTransition(async () => {
      const result = await deleteDeliverableCatalogItem(id);
      if (result.ok) {
        toast.success("Removida do catálogo.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const totalDays = initial.reduce((s, i) => s + i.estimated_days, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Cadastre aqui todas as etapas padrão do estúdio. Nos projetos, use{" "}
          <strong>Importar do catálogo</strong> para trazer a lista de uma vez.
        </p>
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
          Nova etapa
        </Button>
      </div>

      {initial.length > 0 && (
        <p className="font-mono text-[10px] uppercase text-muted-foreground">
          {initial.length} etapa(s) · ~{totalDays} dias no pacote completo
        </p>
      )}

      {open && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {editingId ? "Editar etapa" : "Nova etapa no catálogo"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome da etapa / entregável *</Label>
                <Input
                  placeholder="Ex.: Manual de marca, Desenvolvimento do site…"
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
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Inicia após</Label>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma (primeira etapa)</SelectItem>
                        {predecessorOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Área E33 (filtro)</Label>
                <Controller
                  control={control}
                  name="service_line"
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Qualquer projeto</SelectItem>
                        {serviceLines.map(([v, label]) => (
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
                <Label>Profissional</Label>
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
                <Input {...register("notes")} />
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
          Catálogo vazio. Cadastre as etapas que você repete em vários projetos
          (identidade, site, conteúdo…).
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Depende de</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.service_line
                      ? serviceLineLabels[item.service_line]
                      : "Geral"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.estimated_days}d</TableCell>
                  <TableCell>
                    {item.predecessor ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranch className="size-3" />
                        {item.predecessor.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Início</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
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
    </div>
  );
}
